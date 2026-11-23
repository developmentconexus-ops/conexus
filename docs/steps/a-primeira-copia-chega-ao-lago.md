# A primeira cópia chega ao lago

Trilha Dados, a etapa 2 do lago, na ordem de [trilhas/dados.md](trilhas/dados.md). A pergunta:
"Uma tabela de um sistema ligado chega inteira, a mudança de hoje aparece na rodada seguinte, e eu
vejo isso na página Dados?" Os estudos da etapa ficam fora do repositório (delivery L21): o estudo
`conexus-lago2-estudo` e o reestudo `conexus-lago2-reestudo`, de 2026-11-23, que o fundador pediu
depois de recusar a decisão B da primeira versão deste cartão e aprovou no mesmo dia ("Lago 2 aprovo
os recomendados"). Este cartão cita deles só o que a construção precisa. A página ainda não está
aprovada.

Cada linha do `main` citada foi lida em `538b0562`; nas pastas da cópia ele é igual ao `4ea1afbf`
que o reestudo leu. `EST/<nome>:N` é a linha `N` do relatório `data/conexus-<nome>/report.md` do
firstmate. As versões que a construção instala são as que o estudo leu e rodou: `meltano` 4.4.1,
`singer-sdk` 0.54.9, `pyiceberg` 0.12.0, `pyarrow` 26.0.1, Python 3.13, e `@aws-sdk/client-ecs`,
`client-sqs`, `client-ssm` e `client-athena` 3.1175.0, a versão que o `main` fixa para o
`client-cloudformation` e o `client-s3tables` (o `client-s3` de hoje fica em 3.1146.0).

**Antes da construção.**

1. **A mudança de método para Python** (registro 0074; ela não entrou: o `main` não tem
   `apps/extraction/` nem linha do Meltano no `docs/reference/stack.md`): as linhas do `stack.md`
   para o Meltano, o singer-sdk, o PyIceberg, o pyarrow, o `uv` e os quatro clientes novos da AWS;
   um job de Python na CI (formatação, tipos e testes de `apps/extraction/`); a conferência de
   documentos lendo as dependências de Python; a regra de máquina do adaptador (importa só o índice
   do kit e não nomeia conector, 0071); e uma frase na testing T26 para as formas do Singer e do
   Meltano. É um pull request de método só de documentos e configuração, com a palavra do fundador
   (delivery L20). A parte 0 não espera por ele; a U4 e a U5 não começam antes dele.
2. **O reajuste da Metal Nobre**, antes de a parte 0 ser publicada (a seção do mesmo nome, abaixo).
3. **A segunda preparação da conta de laboratório** (decisão E), pelo firstmate, com a palavra do
   fundador, antes de a U6 publicar a plataforma.
4. **O L.2 à mão**, antes do G2: o firstmate, com a palavra do fundador, sobe na conta de
   laboratório uma tarefa avulsa na forma da prova (`conexus-lab-trilho/fases2a4/plataforma.py:80-90`),
   que faz o login e lê uma página do Sankhya do fundador. Se o gateway recusar o endereço da AWS,
   nenhuma unidade da parte 1 começa e a etapa volta ao fundador (0071). O critério 33 repete o teste
   com a imagem e a plataforma da U6.

Se a mudança de método mesclar com outra forma, a unidade segue a forma mesclada e o firstmate relê
esta seção.

## A página do fundador

**No fim desta etapa** você abre a ligação do Sankhya em **Integrações**, marca a tabela `TGFCAB`
numa seção nova, **Tabelas no lago**, e ela chega ao lago da empresa inteira, com as 450 colunas da
sua instalação. Na página **Dados** você vê que tipo de rodada foi; a nota que você alterar hoje
aparece na rodada seguinte; e, quando a cópia da ligação para, chega um e-mail e um lembrete por dia
até ela voltar. O banco da empresa deixa de receber cópias: o lago é a única fonte.

**O que mudou desde a versão que você viu.** Você recusou a decisão B em 2026-11-23 ("nao e pra ter
essa opcao voce esta tratando uma empresa implementada e criando solucao paralela, nossa fonte e o
lago") e aprovou o reestudo no mesmo dia. O cartão mudou assim:

- **Não existe mais o campo "Onde guardar"** nem a marca **No lago**: o lago é o único lugar. No
  lugar da B vale a sua K2 de 2026-11-19: escolher na página da ligação, com nada marcado.
- **A tabela que prova a etapa é a `TGFCAB` inteira** (F), com o nome do Sankhya e todas as colunas,
  e não o modelo **Vendas**, que era uma consulta com a regra de venda dentro, 11 das 450 colunas e
  um nome de negócio. A regra "o que é uma venda" vai para a camada Negócio, depois do lago.
- **Uma parte nova, a parte 0**: o que cria cópia no banco da empresa sai, as três cópias da Metal
  Nobre são apagadas pelo botão Apagar, e o Builder deixa de propor cópia.
- **A rodada e o intervalo são da ligação** (G): uma rodada copia as tabelas marcadas daquela
  ligação.
- **A D4 sai** (D): os dois logins do banco da empresa caem na etapa 4, com o esquema `sync`.
- **A janela de 30 dias sai** com o modelo Vendas. A primeira versão dizia que o Vendas guardava só
  30 dias; o reestudo achou que isso estava errado, e agora não pesa.

**Como a etapa chega até você: em quatro partes.** A etapa passa de longe do tamanho de um cartão
(a conta está em "As unidades"): uns 3.900 linhas mudadas na parte 0, quase todas tiradas, e umas
4.700 nas partes 1 a 3. Cada parte tem o seu pull request, você a usa quando ela entra no ar, e a
etapa fecha na parte 3. O cartão é um só porque as decisões valem para as quatro e você aprova uma
vez. Se preferir um cartão por parte, o conteúdo não muda, só o número de aprovações.

**O roteiro de uso.** No Hub da nuvem, na sua empresa, que já tem lago (etapa 1) e a ligação do
Sankhya.

*Parte 0, a cópia sai do banco da empresa.*

1. Em **Dados**, a lista não tem mais `vendas`, `sankhya_clientes` nem `mercado_livre_pedidos`, e o
   botão **Ligar uma cópia** não existe mais. Num Projeto, o Builder não oferece mais propor uma
   cópia. As pessoas, os papéis, a Memória, as ligações e os Projetos estão como estavam.

*Parte 1, a carga chega.*

2. Em **Integrações**, abra a ligação do Sankhya. Aparece a seção **Tabelas no lago**, com a tabela
   que o Conexus recomenda para o Sankhya nesta etapa: `TGFCAB`, com a descrição do dicionário da sua
   instalação e o número de colunas. Nada vem marcado.
3. Marque `TGFCAB`, escolha o intervalo da ligação e clique **Salvar**.
4. Em **Dados**, `sankhya_tgfcab` aparece com "Rodando…". Quando a primeira carga termina, ela diz
   **Em dia**, com o número de linhas e a hora. Quanto tempo a primeira carga leva não foi medido.
5. Abra a tabela e vá em **Rodadas**: a primeira diz "Completa · inteira" e quantas linhas leu. Em
   **Colunas**, as 450, as 54 da sua empresa (`AD_`) incluídas.
6. O firstmate mostra na sua frente, no console da AWS, a tabela `sankhya_tgfcab` dentro do lago da
   sua empresa, com o mesmo número de linhas. O Hub ainda não lê o lago para ninguém; isso é a
   etapa 3.

*Parte 2, a mudança aparece.*

7. Lance ou altere uma nota no Sankhya. Clique **Rodar agora** na ligação, ou espere o intervalo.
8. A rodada seguinte diz "Completa · só o que mudou" e mostra poucas linhas lidas.
9. O firstmate mostra no console a nota alterada na tabela do lago, com o valor de hoje.

*Parte 3, o aviso.*

10. O firstmate quebra de propósito a senha da ligação de teste. Na rodada seguinte a cópia da
    ligação passa a **Parada**, e chega um e-mail a você e à lista de e-mails da empresa, com as
    tabelas que ela levava. No dia seguinte chega um lembrete. Ele conserta a senha, e na rodada
    seguinte ela volta a **Em dia**, sem e-mail.

**O que você faz, e quando.** No começo: aprova esta página. Antes de a parte 0 entrar no ar: dá a
palavra para o firstmate apagar, pelo botão Apagar, as três cópias da Metal Nobre e as de qualquer
outra empresa que a consulta achar. Antes da parte 1: dá a palavra para a mudança de método, para a
segunda preparação da conta (E) e para o L.2, o primeiro teste de uma tarefa contra o seu Sankhya de
dentro da AWS; se o Sankhya recusar o endereço da AWS, nada da parte 1 é construído e a etapa volta
a você. Na parte 1 e na parte 3: dá a palavra para as permissões novas no banco do Hub (data D11): o
login da empresa ler a linha do próprio lago (H) e as tabelas novas da cópia e do aviso. No fim de
cada parte: faz o roteiro dela, diz o que viu e aprova os textos novos da tela, que o pull request
daquela parte lista.

**O reajuste da Metal Nobre.** Não é preciso apagar a empresa. O firstmate já rodou, com a sua
palavra, o inventário só de leitura no banco do Hub de produção (2026-11-23):

| O que há | Quantos |
| --- | --- |
| Cópias | 3: `vendas` (modelo Vendas, 556.839 linhas), `sankhya_clientes` (modelo Clientes, 47.488 linhas) e `mercado_livre_pedidos` (proposta aceita, 66 linhas) |
| Liberações a Projetos | 3, em 2 Projetos de teste: "Teste" (`vendas` e `mercado_livre_pedidos`) e "Teste UPD8" (`vendas`) |
| Papéis que leem uma cópia | 0 |
| Propostas | 2 |

A busca por `sync.` nos arquivos publicados dos apps não rodou (eles moram no armazenamento de Git do
Hub, fora do banco); as liberações já dizem quais Projetos leem. Os passos:

1. O firstmate roda a mesma consulta em **todas** as empresas, porque a versão da parte 0 não sabe
   mais rodar nem apagar uma cópia do banco. O texto está na seção "O reajuste, os passos do
   firstmate".
2. Com a sua palavra, ele clica **Apagar** em cada cópia achada, na versão que está no ar hoje. O
   Apagar tira a leitura dos apps, apaga a cópia (as rodadas, as liberações e as marcas de quem lê
   vão junto) e derruba a tabela do `sync` e o relógio dela.
3. A mesma consulta mostra zero cópias, e as pessoas, os papéis, a Memória, as ligações e os
   Projetos iguais. Só então a parte 0 é publicada.

O que se perde: as linhas copiadas no `sync` (voltam do Sankhya, pelo lago), o histórico das rodadas
dessas cópias e as três liberações. O que fica: tudo o mais. Os Projetos "Teste" e "Teste UPD8"
ficam sem a tabela até a etapa 4 (a sua J).

**Fica de fora.**

- **O Hub ler o lago** para o Assistente (etapa 3) e para os apps (etapa 4). Até a etapa 3 o
  Assistente lê o Sankhya ao vivo, como já faz quando não há cópia (`C/docs/steps/trilhas/dados.md:156`).
- **Tirar o que lê o banco da empresa.** O catálogo das cópias, a Amostra e os logins de leitura por
  papel saem na etapa 3; a liberação a Projetos, o esquema `sync` e os logins `conexus_sync` e
  `conexus_read` saem na etapa 4. Até lá não têm tabela para ler. As tabelas das cópias de hoje no
  banco do Hub ficam vazias e saem com eles.
- **O Builder propor uma tabela**: volta com a escolha de tabelas, na etapa 6, se alguém pedir.
- **Mais tabelas do Sankhya, a busca no dicionário e a escolha de campos** (etapa 6). Nesta etapa a
  lista recomendada tem só a `TGFCAB`.
- **O que sumiu da fonte some do lago** (etapa 7). Nesta etapa só a primeira rodada é inteira; a
  passada inteira de domingo do motor de hoje não vem.
- **Pausar a cópia de uma ligação.** Desmarcar todas as tabelas para a cópia. Pausar entra se alguém
  pedir.
- **O histórico ligado por tabela** (decisão A). Nenhuma tabela pediu ainda.
- **A segunda classe de credencial**, a que uma renovação derruba (etapa 5). A seção **Tabelas no
  lago** aparece só nas ligações cuja credencial a tarefa pode renovar sozinha: nesta etapa, o
  Sankhya.
- **Atualizar a receita de um lago que já tem dado.** Os lagos de hoje estão vazios: o firstmate os
  apaga e cria de novo pelo botão da Central depois da segunda preparação.
- **O custo por rodada.** A conta de laboratório não separa a fatura por empresa (registro 0072).
- **O botão Seguir uma cópia.** Você decidiu em 2026-11-21 que ele só entra se alguém pedir.
- **As issues `next-card` das pastas da etapa.** Entram: a #940 (a linha sem data de alteração), na
  primeira rodada inteira; a #942 (o relógio visto rodar sozinho), no passo 7 do roteiro; a #1135 (o
  código do sistema sem corte), na tabela nova da rodada; a #1265, a #1266 e a #1267 (o servidor de
  respostas gravadas da QA, as gravações sem leitor e o roteiro de gravação fora do repositório), na
  U8, que muda essas peças. Esperam: a #1136, a #1140 e a #1116, que são da ferramenta `copy_runs` e
  do placar do Assistente, que a etapa 3 muda; a #819, do SQL ao vivo do Assistente no dublê; a #1263
  e a #1264, do lago da etapa 1, cujo gatilho esta etapa não toca.

**As suas decisões nesta etapa.** Todas respondidas em 2026-11-23 ("Lago 2 aprovo os recomendados");
nenhuma nova. O que cada uma faz no cartão:

| # | A decisão | A sua resposta | O que faz no cartão |
| --- | --- | --- | --- |
| A | Por quanto tempo a bruta guarda o histórico | (a) só até entrar na atual | A parte 2 limpa da bruta o que já entrou na atual; a AWS ainda guarda as fotos da tabela por 5 dias. Veredito: remendo (a limpeza é nossa); como nativo, um `DELETE` do Athena depois de cada atualização |
| B | Como a cópia no lago é ligada e aparece | Cai; vale a K2 de 2026-11-19 | Escolher na página da ligação, nada marcado. Veredito: embrulhado (a página da ligação de hoje, com uma seção) |
| C | Quando uma cópia conta como parada | (a) na primeira rodada da ligação que termina com erro | Um e-mail por parada, com as tabelas da rodada; um lembrete por dia. Veredito: remendo (as referências avisam por rodada) |
| D | A D4, as senhas por empresa | (a) sai | Nenhuma unidade da D4; os logins caem na etapa 4. Veredito: nativo (`DROP ROLE`) |
| E | A segunda preparação da conta e os poderes novos | (a) pelo mesmo passo a passo, com a mesma trava | O robô cria o papel que escreve de cada empresa; o teto sobe; a Release cria a plataforma da cópia; o Hub inicia e para a tarefa. Veredito: nativo (IAM, CloudFormation) |
| F | Qual tabela do Sankhya prova a etapa | (a) a `TGFCAB` inteira | 450 colunas, 54 da empresa, 719 mil notas, `DTALTER` e dinheiro. Veredito: nativo nas pontas (o `--discover` do Singer, o dicionário do Sankhya), embrulhado no kit (a lista recomendada) |
| G | Uma tarefa por tabela ou por sistema | (b) uma rodada por ligação | O relógio, a rodada e o intervalo são da ligação. Veredito: nativo (a seleção do `meltano run`; o gatilho por fonte das referências) |
| H | O login da empresa lê a linha do próprio lago | (a) só lê a própria linha, num pull request próprio | O G3 |
| I | Onde a empresa escreve a lista de e-mails do aviso | (a) Configurações, seção Avisos | A U13 |
| J | O app que lê uma cópia, entre a etapa 2 e a 4 | (a) fica sem a tabela até a etapa 4 | Os Projetos "Teste" e "Teste UPD8" leem uma tabela que não existe; na etapa 4 o app declara a `sankhya_tgfcab` e a regra de venda passa para o app ou para a camada Negócio |

## As unidades

| Grupo | Unidade | O que entrega | Pastas | Guia além do de código | Depende de |
| --- | --- | --- | --- | --- | --- |
| G0 A cópia sai do banco (um PR, parte 0) | U1 O motor que cria cópia sai | Saem os modelos do kit, a definição por consulta, ligar e aceitar, a rodada com posse, o relógio por cópia, o SQL que escreve no `sync`, o diálogo **Ligar uma cópia**, as propostas na página Dados | o raio da U1 | data (D6) | o reajuste da Metal Nobre feito |
| G0 | U2 O Builder deixa de propor cópia | Sai `copy_propose`, com o cartão dele na conversa e a sua linha nas listas de ferramentas | o raio da U2 | testing (T5) | U1 |
| G1 O kit declara tabelas (um PR, parte 1) | U3 O kit para a cópia | A declaração por tabela da fonte; o gancho do dicionário do Sankhya; a `TGFCAB` recomendada; a página em linhas e bytes; a sessão; a classe da credencial; o número exato; os dublês que mudam um registro | o raio da U3 | testing (T5, T29) | G0 mesclado |
| G1 | U4 O adaptador | `apps/extraction/tap/`, o leitor Singer único, que lê só a declaração do kit e copia numa rodada as tabelas escolhidas | o raio da U4 | testing (T26) | U3; a mudança de método |
| G2 A tarefa e a plataforma (um PR, parte 1) | U5 A tarefa | `apps/extraction/`: o projeto `uv`, o `meltano.yml`, o gravador do lago, a entrada da tarefa, a imagem; o L.1, o L.3 e o L.5 | o raio da U5 | security (S31, S41) | G1 mesclado; a mudança de método |
| G2 | U6 A plataforma da cópia | Em `infra/aws/`: a fila, a regra, o cluster, a tarefa, o depósito de imagens e a rede; o papel que escreve; o teto; os poderes do Hub; a preparação; a Release monta a imagem; o L.2 e o L.6 | o raio da U6 | security (S36, S40) | U5; a segunda preparação (E) |
| G3 As tabelas da cópia do lago (um PR, data D11, parte 1) | U7 A migração e a permissão | `lake_copy`, `lake_table`, `lake_run`, `lake_table_run`; a leitura da linha do lago pela empresa (H); saem `copy_follower` e `copy_notice` | o raio da U7 | data (D6, D10, D11, D15) | G0 mesclado |
| G4 A cópia pelo Hub (um PR, parte 1) | U8 O disparo e o fim | Marcar na ligação; o relógio da ligação; o disparo; o fim pela fila; a varredura; desmarcar e apagar o lago com tabela; a lista de Dados lendo as tabelas do lago; a #1265, a #1266 e a #1267 | o raio da U8 | data (D25, D27); security (S8, S41) | G2 e G3 mesclados |
| G4 | U9 A tela | A seção **Tabelas no lago** na página da ligação; em Dados, o tipo da rodada, o lugar e o que a tabela do lago ainda não mostra | o raio da U9 | web, design | U8 |
| G5 A mudança aparece (um PR, parte 2) | U10 Só o que mudou | O ponto de parada do Meltano no `S3`; o modo incremental; o atualizar; a limpeza da bruta (A); o L.4 e o L.7 | o raio da U10 | data (D25) | a parte 1 usada |
| G6 As tabelas do aviso (um PR, data D11, parte 3) | U11 As tabelas da parada | A parada na cópia da ligação e o aviso no sino | o raio da U11 | data (D6, D11, D15) | a parte 2 usada |
| G7 O aviso (um PR, parte 3) | U12 O aviso de cópia parada | O e-mail por parada, a linha no sino, o lembrete por dia, a marca **Parada** | o raio da U12 | web; security (S41) | G6 mesclado |
| G7 | U13 A lista de e-mails (I) | As rotas de listar, acrescentar e tirar um e-mail, e a seção **Avisos** de Configurações | o raio da U13 | web, design; security (S8) | G6 mesclado |

Oito grupos, um pull request cada ([delivery L9](../guides/delivery.md)), um commit por unidade.

- **A linha principal.** O G0 primeiro: tirar antes de pôr. Depois o G1 e o G3 em paralelo, porque
  não dividem pasta. O G2 parte do G1 mesclado, porque a imagem leva o adaptador. O G4 parte do G2 e
  do G3 mesclados.
- **As quatro partes.** A parte 0 (G0) termina no passo 1 do roteiro; a parte 1 (G1 a G4), nos
  passos 2 a 6; a parte 2 (G5), nos 7 a 9; a parte 3 (G6 e G7), no 10. Cada parte começa depois de o
  fundador usar a anterior e publica uma versão, com o nome que o firstmate dá pela delivery L17; a
  etapa fecha com a parte 3. Publicar e usar no meio da etapa é leitura deste cartão, com a palavra
  do fundador ao aprová-lo.
- **Só o G3 e o G6 criam ou tiram permissão no banco do Hub** (data D11).
- **O que toca a outra trilha.** A U2 muda arquivos da trilha Agentes e Apps: `builder/connectors/`,
  `builder/company-tools/`, `builder/conversation/`, `builder/app-data/` (só testes),
  `packages/hub-api/src/tools.ts` e `apps/web/src/builder/conversation/`. Pela delivery L1, ela
  espera as unidades da outra trilha que estejam nesses arquivos. Da Plataforma ou do contrato
  compartilhado: `packages/hub-api` (U1, U2, U7, U8, U12, U13), `platform/copy-reader.ts`, `aws.ts`,
  `config-aws.ts`, `test-aws.ts` (U1, U8, U10), `hub/lake/` (U7, U8) e `hub/notifications/` (U7,
  U11, U12, U13). Os pull requests do G0, do G3, do G4, do G6 e do G7 avisam a outra trilha
  (delivery L27).
- **A QA** ([testing T25](../guides/testing.md)) roda depois do G0, do G4, do G5 e do G7, no Hub local
  com o servidor de respostas gravadas.

**Orçamento de código alterado.** Linhas mudadas, as tiradas também, sem testes nem gerados (o
`lake.template.json` é gerado; os dublês e as gravações não contam; o Python conta). É estimativa do
cartão, sobre o `wc -l` das pastas e as medidas do estudo, entre parênteses. U1: ~3.400, quase todas
tiradas (`hub/copies/` cria e roda em ~1.600, `builder/copy-clock/` 300, `platform/copy-sql.ts` ~250,
`hub/connectors/copy-port.ts` e as provas das propostas ~600, os modelos e a leitura por consulta do
kit ~400, as telas ~550). U2: ~500, quase todas tiradas. U3: ~700 (a sessão, 87; o dicionário, sobre a
sonda de 286). U4: ~400 (344). U5: ~560 (o gravador, 165). U6: ~480. U7: ~170. U8: ~950 (os
fechadores, de 172 a 312). U9: ~380. U10: ~420 (o atualizar, 144). U11: ~90. U12: ~480. U13: ~200.
Total da etapa: cerca de 8.700 linhas. Parte 0: ~3.900; parte 1: ~3.640; parte 2: ~420; parte 3:
~770. A razão de não cortar em cartões está no T.9. Se a parte 1 medir acima de 3.900 no fim do G4,
a parte 3 sai deste cartão e vira um cartão próprio, com as mesmas unidades; o firstmate diz ao
fundador antes de começar a parte 2.

## Os critérios de aceite

Os testes entram pela porta pública de cada peça ([testing T5](../guides/testing.md)): a rota do Hub;
a linha de comando do adaptador; a entrada da tarefa pelo `meltano run`; o `cdk synth` com as
asserções da receita. "Lab" é a conta de laboratório, com a palavra do fundador; o resultado vai no
pull request, e não no CI (T14).

### Parte 0, a cópia sai do banco da empresa

| # | Unidade | Critério, observável de fora, com a recusa | Teste que o prova | Nível |
| --- | --- | --- | --- | --- |
| 1 | U1 | Nenhuma rota cria, aceita, roda, pausa, retoma, muda o intervalo ou apaga uma cópia no banco da empresa: `POST /copies`, a recusa de proposta, `pause`, `resume`, `interval`, `run` e `DELETE` de uma cópia respondem 404 de rota; `listCopyModels` não existe no contrato | `apps/server/src/hub/copies/routes.test.ts`, "o que cria cópia saiu", contra o servidor de teste | must |
| 2 | U1 | O kit não tem modelo de cópia, nem a definição por consulta (`QUERY`), nem `window`, nem `PAGE_ROWS`; a conformidade do kit recusa um conector que ainda declare `models` | `packages/connectors/src/kernel/conformance.test.ts`, "nenhum modelo"; `npm run typecheck` | must |
| 3 | U1 | O Hub não registra nenhum relógio de cópia: a subida não cria linha do fluxo `conexus-copy-run` em `mastra.schedules`, e remover uma empresa não chama mais o relógio das cópias | `apps/server/src/hub/operations/client-deletion.test.ts`, os casos de hoje, verdes sem o passo das cópias; `apps/server/src/conversations-of.ts` sem `copyClockOf`, pelo `typecheck` e pelo `knip` | must |
| 4 | U1 | A página **Dados** não mostra **Ligar uma cópia**, as propostas, **Pausar**, **Retomar**, **Intervalo**, **Rodar agora** nem **Apagar** de uma cópia do banco; numa empresa sem cópia, o vazio diz a frase da matriz | `apps/web/src/hub/copies/copy-list.test.tsx` e `copy-detail.test.tsx`, "sem o motor de hoje" | must |
| 5 | U1 | O que lê continua: com uma cópia do banco semeada pelo ajudante de teste, Descrever a lista, Ler e Consultar a leem, a Amostra a mostra, e a liberação a um Projeto e as marcas de quem lê funcionam como hoje | os testes de hoje de `hub/data/`, `hub/copies/` (`catalog-view`, `readers`, `sample`, `grants`) e `builder/app-data/`, com o ajudante novo em lugar de `enableCopy`, sem mudar o que esperam | must |
| 6 | U2 | O Builder não tem a ferramenta `copy_propose`: ela não está na lista de ferramentas de nenhum agente, e a conformidade das ferramentas passa sem ela | `apps/server/src/builder/company-tools/tool-sets.test.ts` e `conformance.test.ts`, "sem copy_propose" | must |
| 7 | U2 | Uma conversa antiga que tem uma chamada de `copy_propose` abre e mostra a linha da ferramenta com o nome dela, como uma ferramenta que não existe mais, sem o cartão de proposta e sem erro | `apps/web/src/builder/conversation/tool-row.test.tsx`, "a ferramenta que saiu", na forma do caso "desconhecida no nome legível" de hoje | must |
| 8 | U1 | A versão da parte 0 só é publicada com a consulta do reajuste em zero cópias em todas as empresas; o resultado vai no pull request do G0 | a consulta da seção do reajuste, pelo firstmate, com a palavra do fundador | must |

### Parte 1, a carga chega

| # | Unidade | Critério, observável de fora, com a recusa | Teste que o prova | Nível |
| --- | --- | --- | --- | --- |
| 9 | U3 | O Sankhya declara a tabela `TGFCAB`, com a chave `NUNOTA` e a alteração por `DTALTER`, colunas descobertas; o gancho `descobrirTabelas` devolve, do dicionário do dublê, a descrição da tabela e cada coluna com nome, tipo e descrição; uma tabela que o dicionário não tem volta ausente, nunca inventada | `packages/connectors/src/sankhya/copy-tables.test.ts`, com o dublê | must |
| 10 | U3 | A conformidade recusa: uma tabela declarada duas vezes; uma chave ou coluna de alteração fora das colunas declaradas; uma tabela de colunas descobertas num conector sem gancho; uma tabela de operação sem colunas | `packages/connectors/src/kernel/conformance.test.ts`, "a declaração por tabela" | must |
| 11 | U3 | A leitura de uma tabela pede no máximo as linhas da página do conector; quando a resposta passa dos bytes da página, a próxima página pede menos linhas; uma tabela de 450 colunas do dublê lê inteira, sem teto de colunas | `packages/connectors/src/sankhya/copy-tables.test.ts`, "a página em bytes" | must |
| 12 | U3 | Numa cópia que dura mais que o token, a sessão do kit renova antes do fim, desloga a velha, e no fim não sobra sessão aberta; uma leitura recusada por sessão vencida renova e repete uma vez, e a segunda recusa termina em `COPY_SOURCE_NEEDS_REAUTH` | `packages/connectors/src/kernel/session.test.ts`, com o dublê do Sankhya e o relógio de teste | must |
| 13 | U3 | O Hub lê e confere uma ligação pela sessão do kit; o "renova e repete uma vez" sai de `hub/connectors/` | `apps/server/src/hub/connectors/connections-refresh.test.ts`, `connections-sessions.test.ts` e `write-lost.test.ts`, os casos de hoje, verdes sem mudar o que esperam | must |
| 14 | U3 | Todo login do kit declara a classe da credencial; o Sankhya declara compartilhável; os outros, exclusiva; a conformidade recusa um conector sem a classe | `packages/connectors/src/kernel/conformance.test.ts`, "a classe da credencial" | must |
| 15 | U3 | O número `12345678901234567890` num corpo JSON chega ao Hub e ao adaptador como `"12345678901234567890"` quando o conector declara números exatos; `wire.ts` não chama mais `JSON.parse` sem o leitor do kit. O dublê do Sankhya guarda `VLRNOTA` como texto (hoje `REAL`, `fake-sales.ts:131`) e ganha uma nota de `1234567890123.123456` | `packages/connectors/src/kernel/exact-json.test.ts`; `apps/server/src/hub/connectors/wire.test.ts`, "o número grande"; `sankhya/fake.test.ts`, "o valor de 19 dígitos" | must |
| 16 | U3 | Entre duas leituras, o dublê do Sankhya altera, cria e apaga uma nota, e o do HubSpot altera e remove um negócio, por rotas que só o dublê tem; o modo real não as tem | `packages/connectors/src/sankhya/fake.test.ts` e `hubspot/fake.test.ts`, "o registro muda entre duas leituras" | must |
| 17 | U4 | `tap --about` e `tap --discover` respondem para todo conector que declara uma tabela: o `--discover` do Sankhya traz as colunas do dicionário, o do HubSpot as declaradas; a bateria padrão do singer-sdk passa sobre a saída crua dos dois | `apps/extraction/tap/src/tap.test.ts`; `apps/extraction/tests/test_tap_battery.py` | must |
| 18 | U4 | Uma rodada com duas tabelas escolhidas no catálogo lê as duas, uma depois da outra, e só elas; cada uma emite SCHEMA, RECORD com a versão da passada, STATE a cada página e ACTIVATE_VERSION no fim; a primeira passada lê tudo, a linha sem `DTALTER` incluída (#940); nenhum campo da credencial aparece na saída | `apps/extraction/tap/src/tap.test.ts`, "duas tabelas numa rodada", "a linha sem data" e "nada do segredo na saída" | must |
| 19 | U4 | Um login recusado faz o adaptador sair com código diferente de zero e escrever no arquivo de resultado o código do kit (`COPY_SOURCE_NEEDS_REAUTH`, `COPY_SOURCE_REFUSED`, `COPY_SOURCE_UNREACHABLE` ou `COPY_SOURCE_UNREADABLE`) e a tabela em que parou, nunca o corpo | `apps/extraction/tap/src/tap.test.ts`, "a fonte recusa" | must |
| 20 | U4 | A regra de máquina da mudança de método recusa um import de `packages/connectors/src/sankhya/` e um nome de conector plantados no adaptador | o check da regra, em `npm run deps`, com o caso plantado no teste da regra | must |
| 21 | U5 | Pelo `meltano run`, o gravador acrescenta numa tabela Iceberg local as linhas do dublê do Sankhya, com `_sdc_sequence` e `_sdc_table_version`, o dinheiro em `decimal(38,9)`, e a soma bate com a da fonte; `1234567890123.123456` chega igual; as 450 colunas do dublê chegam | `apps/extraction/tests/test_target.py`, "a passada inteira chega à bruta" e "a tabela larga" | must |
| 22 | U5 | Um valor que não cabe em `decimal(38,9)` termina a rodada com `COPY_LAKE_WRITE_FAILED`, sem gravar o lote | `apps/extraction/tests/test_target.py`, "o valor que não cabe" | must |
| 23 | U5 | A entrada lê o parâmetro da rodada, grava o segredo num arquivo `0600` e só o caminho vai à configuração do Meltano; nenhuma variável de ambiente do leitor e do gravador, nem linha do registro da tarefa, tem um campo do segredo | `apps/extraction/tests/test_entry.py`, "o segredo fica no arquivo" | must |
| 24 | U5 | A entrada manda à fila um resultado só por rodada, na forma `CopyTaskResult`, com as contagens de cada tabela e o código; nunca o conteúdo de uma linha. Uma falha do leitor dá o código dele; do gravador, `COPY_LAKE_WRITE_FAILED` | `apps/extraction/tests/test_entry.py`, "um resultado por rodada", contra a gravação da fila | must |
| 25 | U5 | Com o parâmetro da rodada apagado no meio, a tarefa para no lote seguinte, sem gravar mais e sem mandar resultado | `apps/extraction/tests/test_entry.py`, "a rodada fechada para a tarefa" | must |
| 26 | U5 | A imagem (Node 24, Python 3.13, Meltano, o adaptador e o gravador, x86) responde a `tap --about` e a `meltano --version` antes de ser publicada; no Fargate (L.1), contra o dublê do Sankhya, as linhas chegam à bruta do `S3 Tables` e a soma bate | `scripts/workflows.test.ts`, "a imagem responde antes de sair"; Lab, no pull request do G2 | must |
| 27 | U5 | Na AWS (L.3), o fim normal, a falha do leitor, a falha do gravador e um `StopTask` chegam à fila com o motivo certo nos quatro | Lab, no pull request do G2 | must |
| 28 | U5 | Na AWS (L.5), a soma de `decimal(38,9)` lida pelo Athena bate com a da fonte | Lab, no pull request do G2 | must |
| 29 | U6 | A plataforma tem a fila e a fila de mortos, a regra que manda à fila a parada das tarefas do cluster da cópia, o cluster, a definição de tarefa única (2 vCPU, x86, sem segredo no ambiente), o depósito de imagens e a rede de sub-redes públicas sem NAT | `infra/aws/test/platform.test.ts`, "a plataforma da cópia" | must |
| 30 | U6 | A receita do lago cria o papel `conexus-<lago>-escritor`, com o teto, confiando só nas tarefas do ECS da conta, com as concessões de escrita nas duas áreas do lago daquela empresa e a leitura dos parâmetros da empresa | `infra/aws/test/lake.test.ts`, "o papel que escreve" | must |
| 31 | U6 | Na AWS (L.6), o papel que escreve de A grava nas duas áreas de A e é recusado nas de B, e não lê o parâmetro de uma rodada de B | Lab, no pull request do G2 | must |
| 32 | U6 | O papel do Hub pode iniciar e parar só a tarefa da cópia, entregar só papéis `conexus-*-escritor` às tarefas do ECS, gravar e apagar só parâmetros `/conexus/copia/*`, ler e apagar mensagens só da fila da cópia, e listar e apagar tabelas só de depósitos `conexus-*`; nada além | `infra/aws/test/platform.test.ts`, "os poderes do Hub" | must |
| 33 | U6 | Na AWS (L.2), uma tarefa faz o login e lê uma página do Sankhya do fundador. Se o gateway recusar, a etapa para e volta ao fundador | Lab, no pull request do G2, antes de qualquer outro teste da parte 1 | must |
| 34 | U6 | A preparação deixa a Release criar as peças do 29 e nada além do que já deixava; a Release monta a imagem, publica-a e só então publica a plataforma, com a tarefa apontando para a imagem pelo digest | `infra/aws/test/preparation.test.ts`, "a segunda preparação"; `scripts/workflows.test.ts`, "a imagem da cópia antes da plataforma" | must |
| 35 | U7 | As quatro tabelas existem com as conferências do banco: uma cópia por ligação; uma tabela marcada por fonte e ligação, e um nome por empresa; uma rodada aberta por ligação; o código do sistema com teto (#1135). `copy_follower` e `copy_notice` não existem mais | `apps/server/src/hub/copies/lake-tables.test.ts`; `catalog.test.ts` | must |
| 36 | U7 | O login da empresa lê, da linha do lago, só a da própria empresa e só as colunas nomeadas; gravar, mudar ou apagar é recusado; a foto do catálogo muda só nisso e nas tabelas novas | `apps/server/src/hub/lake/tables.test.ts`, "a empresa lê a sua linha"; `catalog.test.ts` | must |
| 37 | U8 | `GET` das tabelas no lago de uma ligação do Sankhya devolve a `TGFCAB` com a descrição e o número de colunas do dicionário, desmarcada, e o estado do lago; numa ligação de credencial exclusiva, numa de um conector sem tabela declarada ou para quem não lê a ligação, a seção não vem (o campo `lake` é `UNAVAILABLE`, com o motivo); com o dicionário fora do ar, a tabela vem com o nome do kit e sem descrição | `apps/server/src/hub/copies/lake-routes.test.ts`, "a lista da ligação" | must |
| 38 | U8 | Salvar a marca da `TGFCAB` cria a cópia da ligação, a linha `sankhya_tgfcab`, o relógio da ligação e dispara a primeira rodada, inteira; salvar de novo o mesmo conjunto não muda nada; numa empresa sem lago pronto responde 409 `COPY_LAKE_NOT_READY` sem criar nada; uma tabela que o kit não declara, 422; quem não gerencia cópias, 403; a mesma tabela de outra ligação do mesmo sistema, 409 `COPY_NAME_TAKEN` | `lake-routes.test.ts`, "marcar" | must |
| 39 | U8 | A cada disparo, o Hub abre uma rodada da ligação, lê o dicionário para as colunas da tela, grava o parâmetro e inicia a tarefa com o papel da empresa e o `clientToken` de rodada e tentativa, levando as tabelas marcadas; com rodada aberta, o disparo responde "já está rodando" e não grava nada | `apps/server/src/hub/copies/lake-run.test.ts`, "o disparo", contra as gravações da AWS | must |
| 40 | U8 | **Rodar agora** duas vezes ao mesmo tempo inicia uma tarefa só | `lake-run.test.ts`, "dois disparos juntos" | must |
| 41 | U8 | O resultado da tarefa fecha a rodada uma vez, com o resultado, as contagens de cada tabela, `rows` e o código; a parada do ECS que chega depois não muda nada; quem chega primeiro fecha | `apps/server/src/hub/copies/lake-queue.test.ts`, "o resultado e a parada" | must |
| 42 | U8 | Uma parada do ECS sem resultado fecha a rodada como `ERROR` `COPY_TASK_LOST`; uma tarefa parada pelo Hub fecha como `INTERRUPTED` | `lake-queue.test.ts`, "a tarefa que morreu" | must |
| 43 | U8 | No disparo, uma rodada aberta cuja tarefa a AWS diz parada ou não conhece, ou aberta há mais de 6 horas, é fechada antes de abrir a nova | `lake-run.test.ts`, "a varredura" | must |
| 44 | U8 | Toda rodada fechada apaga o parâmetro dela; um parâmetro que a AWS não tem conta como apagado | `lake-queue.test.ts`, "o parâmetro sai no fim" | must |
| 45 | U8 | Um `RunTask` recusado fecha a rodada como `ERROR` `COPY_LAKE_UNAVAILABLE` e apaga o parâmetro; um `RunTask` sem resposta é repetido com o mesmo `clientToken`, e a AWS não inicia duas | `lake-run.test.ts`, "a AWS recusa" e "a AWS não responde" | must |
| 46 | U8 | Dez disparos de dez ligações no mesmo segundo (L.9): o parâmetro recusado por cota é refeito, e as dez rodadas abrem | Lab, no pull request do G4 | should |
| 47 | U8 | Desmarcar uma tabela apaga as tabelas dela nas duas áreas do lago e a linha; desmarcar a última apaga também a cópia da ligação e o relógio; desmarcar com a rodada aberta responde 409 `COPY_RUN_OPEN` e não muda nada; desligar a ligação leva a cópia dela pelo mesmo caminho; na AWS (L.8), nada sobra | `lake-routes.test.ts`, "desmarcar"; Lab | must |
| 48 | U8 | Apagar o lago de uma empresa com tabelas apaga as tabelas, depois as áreas e a pilha, e leva as cópias do lago da empresa; na AWS (L.8), nada sobra | `apps/server/src/hub/lake/lake-remove.test.ts`, "o lago com tabela"; Lab | must |
| 49 | U8 | A lista de Dados mostra cada tabela marcada, agrupada pela ligação, com o estado, as linhas, a hora e o intervalo da ligação; as Rodadas de uma tabela são as da ligação que a levaram, com as contagens dela | `apps/server/src/hub/copies/routes.test.ts`, "a lista de Dados lê o lago" | must |
| 50 | U8 | O registro do Hub mostra `COPY_RUN_ENDED` com as contagens e a ligação; nem ele nem a fila levam o conteúdo de uma linha ou do segredo | `lake-queue.test.ts`, "o que o registro leva" | must |
| 51 | U8 | Sem cópia de ligação, o Hub não chama a AWS; com cópias, o consumidor da fila não abre conexão com o banco enquanto não chega mensagem (data D27) | o teste do banco que dorme de hoje (data D27), com o consumidor ligado | must |
| 52 | U8 | Uma tabela do lago não cria nada no banco da empresa (nem o esquema `sync`, nem login, nem tabela) e não entra no catálogo que o Assistente e os Projetos leem | `lake-routes.test.ts`, "a tabela do lago fica fora do banco"; o teste de conformidade do contrato | must |
| 53 | U8 | O servidor de respostas gravadas responde `DescribeStackEvents` e as chamadas do `S3 Tables` (#1265); nenhuma gravação fica sem teste que a leia, e os ids de laboratório saem delas (#1266); o roteiro que grava está no repositório (#1267) | `apps/server/src/platform/recordings.test.ts`, "toda gravação tem leitor"; `aws.test.ts`, pelo servidor de respostas gravadas | must |
| 54 | U9 | Na página da ligação, a seção **Tabelas no lago** lista a `TGFCAB` com a descrição e as colunas, desmarcada, o intervalo e **Salvar**; marcar e salvar mostra a tabela marcada e "Rodando…"; quem não gerencia cópias vê a lista sem as marcas; sem lago pronto, a frase da matriz | `apps/web/src/hub/connectors/lake-tables.test.tsx` | must |
| 55 | U9 | Em **Rodadas**, o resultado diz "Completa · inteira" ou "Completa · só o que mudou"; em **Detalhes**, "As linhas ficam no lago da empresa."; **Amostra**, **Quem lê** e a liberação a Projetos dizem "A leitura das linhas chega numa próxima etapa." e não chamam o Hub; cada código novo tem a sua frase | `apps/web/src/hub/copies/copy-detail.test.tsx`, "a tabela do lago" | must |

### Parte 2, a mudança aparece

| # | Unidade | Critério, observável de fora, com a recusa | Teste que o prova | Nível |
| --- | --- | --- | --- | --- |
| 56 | U10 | Pelo `meltano run`, a segunda rodada de uma ligação do Sankhya lê, de cada tabela, só o que mudou desde o ponto de parada dela, guardado no depósito do estado com o prefixo da empresa; uma tabela sem coluna de alteração (o negócio do HubSpot) lê tudo | `apps/extraction/tests/test_state.py`, "a segunda rodada" | must |
| 57 | U10 | Na AWS (L.4): uma rodada morta no meio retoma lendo menos que o total; o estado salvo nunca está adiante das linhas gravadas; o papel de A não lê o prefixo de B | Lab, no pull request do G5 | must |
| 58 | U10 | Depois de uma rodada inteira e uma só do que mudou, a atual tem uma linha por chave, igual à fonte, com o valor de hoje; o `MERGE` roda um caso por instrução e passa com as 450 colunas | `apps/extraction/tests/test_update.py`, contra as gravações do Athena; Lab (L.7) | must |
| 59 | U10 | Depois de cada atualização, a bruta não tem mais as linhas que já entraram na atual, e a atual não muda com a limpeza (decisão A) | `test_update.py`, "a limpeza"; Lab (L.7) | must |
| 60 | U10 | A primeira rodada de uma tabela e a rodada depois de um estado perdido são inteiras; as outras, só o que mudou; **Rodar agora** segue o modo | `apps/server/src/hub/copies/lake-run.test.ts`, "o modo da rodada" | must |
| 61 | U10 | Desmarcar uma tabela apaga também o ponto de parada dela | `lake-routes.test.ts`, "o ponto de parada sai" | must |

### Parte 3, o aviso

| # | Unidade | Critério, observável de fora, com a recusa | Teste que o prova | Nível |
| --- | --- | --- | --- | --- |
| 62 | U11 | Existem a parada na cópia da ligação e o aviso no sino, com as conferências do banco; a foto do catálogo muda só nisso | `apps/server/src/hub/notifications/tables.test.ts`; `catalog.test.ts` | must |
| 63 | U12 | A primeira rodada com erro de uma ligação que não estava parada anota a parada, com a hora e o código; sai um e-mail ao Dono, a cada Administrador e à lista de e-mails da empresa, com as tabelas da rodada, e uma linha no sino de cada Dono e Administrador | `apps/server/src/hub/notifications/copy-stop.test.ts`, "a primeira falha" | must |
| 64 | U12 | Duas rodadas com erro da mesma ligação, uma depois da outra, dão um e-mail e uma linha no sino por pessoa | `copy-stop.test.ts`, "a segunda falha não avisa" | must |
| 65 | U12 | A primeira rodada completa tira a parada, e desmarcar a última tabela ou desligar a ligação também; o relógio do lembrete sai, sem e-mail | `copy-stop.test.ts`, "a volta" | must |
| 66 | U12 | Um lembrete por dia, na hora do T.15, por ligação ainda parada, com as tabelas dela; nenhum lembrete depois que ela volta, e nenhum no dia em que ela parou | `copy-stop.test.ts`, "o lembrete" | must |
| 67 | U12 | Na página Dados e na seção da ligação, a cópia parada mostra **Parada** e o motivo; quem não é Dono nem Administrador não recebe o aviso no sino | `apps/web/src/hub/copies/copy-list.test.tsx`, "parada"; `copy-stop.test.ts`, "quem recebe" | must |
| 68 | U12 | Um e-mail que não sai não desfaz a parada e é registrado; o próximo lembrete do dia vai | `copy-stop.test.ts`, "o e-mail que não sai" | must |
| 69 | U13 | O Dono e o Administrador listam, acrescentam e tiram um e-mail da lista; o mesmo e-mail com outra caixa é recusado (409 `ALERT_RECIPIENT_EXISTS`); quem não é Dono nem Administrador recebe 403 e não vê a seção; um e-mail acrescentado recebe o próximo aviso | `apps/server/src/hub/notifications/routes.test.ts`, "a lista de e-mails"; `apps/web/src/hub/identity/alert-recipients.test.tsx` | must |

## A matriz de estados

| Tela | Primeira vez | Vazio | Carregando | Erro | Não encontrado | Sem permissão | Vencido ou recusado |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Dados, a lista (U1, U8, U12) | Parte 0: "Nenhuma tabela copiada." Parte 1: "Nenhuma tabela copiada. Para copiar, abra a ligação em Integrações." | O mesmo da primeira vez | O de hoje | O de hoje | Uma tabela desmarcada noutra aba some na próxima leitura | Quem não gerencia cópias vê a mesma lista | A última rodada com erro: o selo de hoje, com a frase do código; parte 3: **Parada**, com o motivo |
| A ligação, a seção Tabelas no lago (U9, U12) | A lista do kit, nada marcado, o intervalo padrão, **Salvar** desligado até mudar algo | Conector sem tabela declarada ou de credencial exclusiva: a seção não aparece | "Lendo o dicionário do Sankhya…" | O dicionário fora do ar: a tabela com o nome do kit e "Não deu para ler o dicionário agora."; `COPY_LAKE_NOT_READY`: "O lago desta empresa não está pronto. Peça ao operador do Conexus."; `COPY_RUN_OPEN`: "A ligação está copiando agora. Desmarque quando a rodada terminar."; `COPY_NAME_TAKEN`: "Outra ligação deste sistema já copia esta tabela." | A ligação desligada: a frase de hoje da página | Quem não gerencia cópias vê as tabelas marcadas, sem caixas nem **Salvar** | Parte 3: a cópia parada mostra **Parada** e o motivo ao lado do intervalo |
| A tabela do lago, Amostra, Quem lê e Projetos (U9) | "A leitura das linhas chega numa próxima etapa." | O mesmo | — | — | — | Como hoje | — |
| A tabela do lago, Rodadas e Detalhes (U9) | A primeira rodada aberta: "Rodando…", sem linhas | Nenhuma rodada ainda: o vazio de hoje | O de hoje | `COPY_LAKE_UNAVAILABLE`: "A AWS não iniciou a cópia. A próxima rodada tenta de novo." `COPY_TASK_LOST`: "A cópia parou antes de terminar. A próxima rodada tenta de novo." `COPY_LAKE_WRITE_FAILED`: "Não deu para gravar no lago. A próxima rodada tenta de novo." | A tabela desmarcada: a frase de hoje | Como hoje | A rodada interrompida: a frase de hoje de `INTERRUPTED` |
| O sino, a linha da parada (U12) | "A cópia de <ligação> parou: <tabelas>." | Sem parada: nenhuma linha | O de hoje | O de hoje | A ligação desligada depois do aviso: a linha fica, com o nome guardado | Só Dono e Administrador recebem a linha | — |
| Configurações, a seção Avisos (U13) | A lista vazia: "Só o Dono e os Administradores recebem os avisos." e o campo de e-mail | O mesmo da primeira vez | O de hoje da página | Um e-mail já na lista: "Este e-mail já recebe os avisos." | Um e-mail tirado noutra aba some na próxima leitura | Quem não é Dono nem Administrador não vê a seção | — |
| O e-mail da parada e o lembrete (U12) | "A cópia de <ligação> parou", com as tabelas, o motivo e o link para a ligação | — | — | Um e-mail que não sai fica no registro do Hub (critério 68) | — | Vai só ao Dono, aos Administradores e à lista | — |

As caixas, a 1280 e a 390 px, seguem a organização A do reestudo (uma seção na página da ligação, a
K2), porque a TD2 já pede "o que a ligação entrega, quais cópias e Projetos a usam, quando cada cópia
rodou" (`C/docs/reference/telas.md:392`). As capturas que o desenho segue são do estudo anterior:
`capturas/hoje/` da página Dados e da ligação, a 1440 e 390 px, e a do Airbyte,
`capturas/referencias/cloud-status-page.png`.

```text
1280 px, a página da ligação                          390 px, a página da ligação
+--------------------------------------------------+  +------------------------------+
| Sankhya · Matriz                   Funcionando   |  | Sankhya · Matriz             |
| Último teste 10:02 · Testar                      |  | Funcionando · Testar         |
| A ligação ...                                    |  | Tabelas no lago              |
| Tabelas no lago                                  |  | [x] TGFCAB                   |
|  [x] TGFCAB  Cabeçalho da nota  450 colunas      |  |     Cabeçalho da nota        |
|              Em dia · 02/11 10:00                |  |     450 colunas · Em dia     |
|  Intervalo [30 min v]   Rodar agora   [Salvar]   |  | Intervalo [30 min v]         |
| Caderno ...                                      |  | Rodar agora      [Salvar]    |
+--------------------------------------------------+  +------------------------------+
1280 px, Dados                                        390 px, Dados
+--------------------------------------------------+  +------------------------------+
| Tabela          Atualizada       Linhas Intervalo|  | sankhya_tgfcab      Em dia   |
| sankhya · Matriz · 1 tabela                      |  | 02/11 10:00 · 719.204        |
| sankhya_tgfcab  Em dia 02/11 10:00 719.204 30 min|  +------------------------------+
+--------------------------------------------------+
```

As peças de `ui/`: a seção e o título que a página da ligação já usa, a caixa de marcar, o seletor de
intervalo de `hub/copies/interval.tsx` (que a U9 move para a ligação), o botão e o selo de hoje;
nenhuma peça nova. A interface do Impeccable roda na QA de cada parte com tela
([Impeccable](../reference/impeccable.md)).

| Campo de contrato | Quem escreve | Quem lê |
| --- | --- | --- |
| `LakeTablesOfConnection.lake` (`READY`, `NOT_READY` ou `UNAVAILABLE` com o motivo) | U8, `hub/copies/lake-routes.ts`, da linha do lago e da classe da credencial | U9, `lake-tables.tsx` |
| `LakeTablesOfConnection.tables[]` (`table`, `label`, `description`, `columns`, `marked`, `name`, `state`) | U8, do kit, do dicionário e de `lake_table` | U9 |
| `LakeTablesOfConnection.interval` e `lastRun` | U8, de `lake_copy` e `lake_run` | U9 |
| `SetLakeCopy` (`tables`, `interval`) | U9, `lake-tables.tsx` | U8, `lake-copy.ts` |
| As falhas `COPY_LAKE_NOT_READY`, `COPY_RUN_OPEN`, `COPY_NAME_TAKEN`, `COPY_TABLE_NOT_DECLARED` | U8 | U9, `text.ts` |
| `CopySummary` de uma tabela do lago (`connection`, `interval`, `rows`, o último resultado) | U8, `hub/copies/list.ts`, de `lake_table` e `lake_run` | U9, `copy-list.tsx`, `copy-detail.tsx` |
| `CopyRun.whole` e as contagens da tabela | U8 (sempre `true` na parte 1); U10 pelo modo | U9, a coluna Resultado |
| `CopyRunFailureCode`: `COPY_LAKE_UNAVAILABLE`, `COPY_TASK_LOST`, `COPY_LAKE_WRITE_FAILED` | U8 no fim; U5 no resultado | U9, `text.ts` |
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
| Salvar as tabelas marcadas (`PUT` da cópia da ligação) | A chave da ligação: as duas gravam o mesmo conjunto, o último vence, e cada uma devolve o que ficou | A transação desfaz as linhas; o relógio é criado depois dela, e o próximo salvar o cria se faltar | O lago lido em outro estado: 409 `COPY_LAKE_NOT_READY`; o dicionário fora: a marca grava, sem colunas | `LAKE_COPY_SET` com as tabelas | 38, 47 |
| O relógio da ligação, criado e apagado (`mastra.schedules`) | O id do relógio é o da ligação: a criação que perde a corrida acha o relógio feito, como `C/apps/server/src/builder/copy-clock/clock.ts:70-79` | Linhas gravadas e relógio não: o próximo salvar cria; **Rodar agora** funciona sem ele | O banco fora: o salvar responde a frase de hoje | `LAKE_CLOCK_FAILED` | 38, 47 |
| Abrir a rodada (`INSERT` em `lake_run`) | O índice de uma rodada aberta por ligação recusa a segunda: "já está rodando" | — (uma instrução) | Banco fora: o disparo não abre nada; o próximo tenta | `COPY_RUN_SKIPPED` com o motivo | 39, 40 |
| Gravar o parâmetro da rodada (`PutParameter`) | Um nome por rodada, sem disputa | A rodada fecha `COPY_LAKE_UNAVAILABLE` | Cota (3 por segundo): refeito com espera, depois `COPY_LAKE_UNAVAILABLE` | `COPY_LAKE_START_FAILED` com o código da AWS | 45, 46 |
| Iniciar a tarefa (`RunTask`) | O `clientToken` de rodada e tentativa: a AWS devolve a mesma tarefa | Sem resposta: repetido com o mesmo token; recusado: a rodada fecha e o parâmetro sai | A AWS fora: `COPY_LAKE_UNAVAILABLE` | `COPY_LAKE_START_FAILED` | 39, 45 |
| O resultado e a parada na fila (o fim) | Quem chega primeiro fecha (`UPDATE ... WHERE ended_at IS NULL`); o segundo não muda nada | A mensagem só sai da fila depois do fim gravado; três entregas falhas vão à fila de mortos | Banco fora: a mensagem volta à fila e é lida de novo | `COPY_RUN_ENDED`; uma mensagem ilegível, `COPY_QUEUE_UNREADABLE`, apagada da fila | 41, 42, 50 |
| Apagar o parâmetro no fim | Apagar duas vezes: a segunda acha nada e conta como apagado | A rodada já está fechada; a tarefa que ainda roda para no lote seguinte | A AWS fora: a varredura do próximo disparo apaga | `COPY_PARAMETER_LEFT` | 25, 44 |
| Gravar `lake_run.task_arn` depois do `RunTask` | Uma rodada só grava (a linha dela) | O Hub cai entre o `RunTask` e a gravação: a varredura acha a tarefa pelo `startedBy` da rodada (`ListTasks`), ou fecha a rodada pelas 6 horas | Banco fora: o mesmo | `COPY_TASK_UNRECORDED` | 43 |
| A varredura no disparo | Duas varreduras fecham a mesma rodada uma vez (o mesmo `UPDATE`) | — | A AWS fora: a rodada aberta há mais de 6 h fecha mesmo assim, como `COPY_TASK_LOST` | `COPY_RUN_SWEPT` | 43 |
| O gravador acrescenta na bruta (`append` do PyIceberg) | Uma rodada aberta por ligação (o índice); o PyIceberg refaz o commit em conflito 4 vezes | Um lote sem commit não aparece; o estado não sai antes dele | O catálogo responde 429 e o PyIceberg não refaz: a rodada termina `COPY_LAKE_WRITE_FAILED` | A linha `METRIC` do SDK e o resultado; nunca uma linha de dado | 21, 22, 24 |
| A tarefa confere a rodada a cada lote | — | Parâmetro apagado: para sem mandar resultado; a parada do ECS fecha o que sobrou | A AWS fora na conferência: conta como fechada e para | `RUN_CLOSED` no registro da tarefa | 25 |
| Desmarcar uma tabela e desligar a ligação | A segunda acha a linha apagada e responde o conjunto de agora | Tabelas do lago apagadas e linha não: a tabela que a AWS não tem conta como apagada; repetir termina | A AWS fora: a linha fica, e a tela diz a frase de hoje de tentar de novo | `COPY_LAKE_TABLE_LEFT` | 47, 61 |
| Apagar o lago com tabelas | A trava do lago de hoje (etapa 1) | Tabelas apagadas e pilha não: o próximo **Apagar o lago** termina | A AWS fora: o estado `delete_failed` de hoje | o de hoje do lago | 48 |
| A Release publica a imagem e a plataforma | O grupo de concorrência da Release de hoje | Imagem publicada e plataforma não: a próxima Release publica a mesma versão | O ECR fora: a Release falha antes do `deploy` | o do workflow | 26, 34 |
| O ponto de parada do Meltano (parte 2) | Uma rodada por ligação; o Meltano grava a cada linha de estado | Morte no meio: o estado é o do último lote gravado | O `S3` fora: o Meltano falha, e a rodada termina com o código do gravador | o de hoje do Meltano | 56, 57 |
| O atualizar e a limpeza (parte 2, três `MERGE`, um `DELETE` na passada inteira e um da limpeza) | Uma rodada por ligação | Entre duas instruções a atual fica num estado do meio; a próxima rodada refaz | O Athena fora: a rodada termina `COPY_LAKE_WRITE_FAILED`; a bruta guarda as linhas | `UPDATE_FAILED` com o código do Athena | 58, 59 |
| Anotar a parada e avisar (parte 3) | Duas rodadas da mesma ligação não fecham juntas (uma aberta por ligação); a parada é uma coluna, gravada só se estava vazia | O e-mail sai depois da transação; um e-mail que não sai não a desfaz | O envio fora: registrado, e o lembrete do dia seguinte vai | `COPY_STOP_MAILED` ou `COPY_STOP_MAIL_FAILED` | 63, 64, 68 |
| O relógio do lembrete, criado com a parada e apagado com a volta (parte 3) | O id do relógio é o da ligação: a criação que perde a corrida acha o relógio feito | Parada gravada e relógio não: a próxima rodada com erro da ligação cria | O banco fora: a rodada fecha sem a parada, e a próxima anota | `COPY_STOP_CLOCK_FAILED` | 65, 66 |
| O lembrete do dia (parte 3) | O relógio do Mastra dispara um por vez; a coluna `told_at` guarda o último | — | O banco fora: o lembrete do dia não sai, e o do dia seguinte sim | `COPY_STOP_REMINDED` | 66 |
| Acrescentar e tirar um e-mail da lista (U13) | O índice `alert_recipient_key` recusa o segundo: 409 `ALERT_RECIPIENT_EXISTS` | — (uma instrução) | Banco fora: a frase de hoje de tentar de novo | o de hoje das rotas | 69 |

## A tabela de referência

A tabela do estudo e do reestudo, com a unidade e o arquivo novo de cada linha. `C/` é o `main` em
`538b0562`; as siglas são as dos estudos: `AB` airbyte `8b40981a`, `AP` airbyte-platform `c46502e`,
`CDK` airbyte-python-cdk `bde4377`, `DLT` dlt `efaf0e3`, `TRM` tap-rest-api-msdk `071b540`,
guardados em `data/conexus-credenciais-framework/refs/`, e `NK` o texto da Nekt guardado em
2026-11-19. A coluna "Muda" diz o que o reestudo mudou: **fica**, **sai** ou **refeita**.

| # | Peça | Muda | Hoje no main | Referência | Veredito | Prova, se não for nativo | Decisão | Unidade | Arquivo novo |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Os modelos de cópia do Sankhya | sai | `C/packages/connectors/src/sankhya/copies.ts:85-170`: consultas com o filtro de venda (`:11`), junções, 4 a 11 colunas, janela de 30 dias (`:83`) | Nekt Protheus, `NK:177802`, mesma situação; Nekt Postgres e Oracle, `NK:140823`, `NK:132600`, e `AB .../JdbcMetadataQuerier.kt:70-80`, `:120`, situação diferente (banco direto) | nativo, ao sair: a tabela da fonte inteira toma o lugar (linha 8) | — | Fundador, 2026-11-19 (D1, D4); 2026-11-23 | U1 | — |
| 2 | A regra "o que é uma venda" | sai da cópia; volta na camada Negócio | `copies.ts:6-7`, `:11` | `NK:22279`, `NK:22335`; `AP .../RowFilteringMapper.kt:35-40` | nativo, ao sair: a regra mora depois do pouso, como nas referências | — | `C/docs/steps/trilhas/dados.md:111-112` | U1 | — |
| 3 | A janela de 30 dias e a passada inteira de domingo | sai | `C/packages/connectors/src/sankhya/copy-read.ts:36-40`; `C/apps/server/src/platform/copy-sql.ts:287-301`; `C/apps/server/src/builder/copy-clock/clock.ts:24-25` | Nekt: nenhuma janela genérica (`notas/notas-nekt.md`, questão 5); Airbyte: nenhum modo de janela (`notas/notas-airbyte.md`, questão 4) | nativo, ao sair: nenhuma referência guarda uma janela | — | F | U1 | — |
| 4 | O motor que cria cópia no banco da empresa: ligar, aceitar, a rodada com posse, o relógio por cópia, o SQL que escreve | sai na etapa 2 | `C/apps/server/src/hub/copies/` (`enable.ts`, `accept.ts`, `propose.ts`, `run.ts`, `source-pass.ts`, `sources.ts`, `whole.ts`, `schedule.ts`), `builder/copy-clock/`, `platform/copy-sql.ts` | nenhuma faz: é a nossa mudança de casa | nativo, ao sair: o lago das linhas 15 a 30 toma o lugar | — | J | U1 | — |
| 5 | O que lê o banco da empresa: o catálogo, Ler e Consultar, a Amostra, Quem lê, a liberação a Projetos, os logins | fica até a etapa 3 ou 4 | `C/packages/hub-api/src/company-data.ts:48-57`; `C/apps/server/src/hub/data/rows.ts:10-43`; `query.ts:79-110`; `C/apps/server/src/platform/copy-reader.ts:219-235`, `:51-82` | 0079 | embrulhado (os estudos das etapas 3 e 4) | Medido antes: 0 de 50 leituras viram meia tabela (0079) | D, J | fica de fora: etapas 3 e 4 | — |
| 6 | O Builder propõe uma cópia (`copy_propose`) | sai na etapa 2 | `C/apps/server/src/builder/connectors/copy-propose.ts`; `C/apps/server/src/hub/copies/propose.ts:215` | Nekt TOTVS RM: uma consulta da empresa como tabela, opcional (`NK:178309`) | nativo, ao sair: nenhuma referência propõe por padrão | — | volta, se pedir, na etapa 6 | U2 | — |
| 7 | Apagar a cópia do banco, para o reajuste | fica até o reajuste; sai com a parte 0 | `deleteCopy`, `C/apps/server/src/hub/copies/leave.ts:196-233`; o fim e o `DROP`, `:161-178`, `:282-300` | — | embrulhado: herdado, já em produção | — | o reajuste | o reajuste; U1 | — |
| 8 | A declaração da tabela no kit: a tabela da fonte, a chave, o modo, a página | refeita | `C/packages/connectors/src/kernel/copy.ts:66-92` (`QUERY`, até 100 colunas `:73`, chave só `bigint` `:81-87`); `PAGE_ROWS = 500` `:6`; `CopyModel` `:184` | 0080, `C/docs/decisions/0080-copy-declared-per-table-raw-appends.md:10-13`; Nekt API, por tabela, `primary_keys`, `replication_key`, `sync_type` (`NK:20888-20897`); `CDK .../declarative_component_schema.yaml:2244-2271` (`page_size` por paginador) | embrulhado: a lista recomendada do kit sobre o `--discover` | O dicionário no dublê, 286 linhas (`EST/descoberta-catalogo:75-80`). Não provado: 450 colunas, a página em bytes (critérios 11, 21) | F | U3 | `packages/connectors/src/sankhya/copy-tables.ts` |
| 9 | A descoberta das colunas pelo dicionário (`TDDTAB`, `TDDCAM`) | nova | nenhuma na cópia; a skill do agente já lê o dicionário (`C/packages/connectors/src/sankhya/skill/SKILL.md:49`) | o `--discover` do Singer; tap-oracle lê `all_tab_columns` (`EST/descoberta-catalogo:135`); Nekt Protheus, os nomes do dicionário (`NK:177778`) | nativo | Medido antes, no dublê (`EST/descoberta-catalogo:75-80`). Não provado no Sankhya real: o passo 2 do roteiro | D1, 2026-11-19 | U3, U4 | — (em `copy-tables.ts`) |
| 10 | O nome no lago | fica | `copyPrefixOf`, `C/packages/connectors/src/kernel/copy.ts:16-18` | Nekt, "`hubspot_deals`" (`NK:12217-12218`); `AP .../Mapper.kt:171-179` | nativo | — | não precisa | U8 | — |
| 11 | O adaptador: do kit a um leitor Singer, um só | fica | nenhum; o laço mora no Hub, `C/apps/server/src/hub/copies/source-pass.ts:194-212`, `hub/connectors/copy-port.ts:243-315` | `TRM tap.py:455`, `:506-540`; `CDK .../concurrent_declarative_source.py:165` | remendo: TypeScript que fala Singer, porque o kit é TypeScript (0074) | 344 linhas, duas classes, 34 e 24 testes da bateria do singer-sdk 0.54.9 (estudo) | 0071 | U4 | `apps/extraction/tap/src/tap.ts` |
| 12 | A sessão dentro da tarefa: reusar, renovar antes do fim, deslogar | fica | `C/apps/server/src/hub/connectors/limits.ts:127`; `read.ts:109-115`, `check.ts:43-48` | `singer-sdk@0.54.9 singer_sdk/authenticators.py:526-527`, `:609-619` | remendo: a peça é do kit | A P2: 87 linhas, 4 renovações em 100 s, nenhuma sessão pendurada; o autenticador lido no singer-sdk 0.54.9 | 0077 | U3 | `packages/connectors/src/kernel/session.ts` |
| 13 | A classe da credencial, compartilhável ou exclusiva | fica | nenhum | nenhuma faz como dado | remendo | O Sankhya: o token vence aos 300 s em uso, e duas sessões convivem (`docs/decisions/0077-how-a-credential-reaches-the-copy-task.md`) | 0077 | U3, U8 | — (muda `kernel/auth.ts`) |
| 14 | O número exato, do provedor ao lago | fica | `C/apps/server/src/hub/connectors/wire.ts:71`; `kernel/list.ts:53-62` | `JSON.parse` com `context.source`, do Node 24; `singer-sdk@0.54.9 singerlib/json.py:40-44`; `DLT dlt/common/arithmetics.py:18-19` | nativo nas pontas; embrulhado no meio | `1234567890123.123456` igual em `decimal(38,9)` (estudo, `numero-exato.txt`) | 0071; T.4 | U3, U5 | `packages/connectors/src/kernel/exact-json.ts` |
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
| 29 | O histórico da bruta | fica | nenhum | nenhuma faz a limpeza: a Nekt não tem bruta com histórico (`NK:8635`); o Airbyte guardava tudo; o `S3 Tables` guarda 120 h de fotos | remendo (a limpeza) | Não provado: L.7 (`docs/decisions/0080-copy-declared-per-table-raw-appends.md`) | A | U10 | — (em `update.py`) |
| 30 | Onde fica o ponto de parada | fica | `C/apps/server/src/hub/copies/tables.ts:274-312` | `meltano@4.4.1 core/plugin/singer/target.py:100-120`; `core/state_store/filesystem.py:45`, `:191-228` | nativo | Local, em arquivo. Não provado no `S3`: L.4 | T.1 | U10 | — (muda `meltano.yml`) |
| 31 | A página Dados: lista, Visão geral, Colunas, Rodadas | fica, com a rodada por ligação | `C/apps/web/src/hub/copies/` (2.967 linhas); `copy-detail.tsx:105-109`, `:170-305`; `text.ts:88-89` | `AP .../locales/en.json:1088-1094`, `:577-578`; Nekt, `NK:22429-22431`; a captura `cloud-status-page.png` | embrulhado | As capturas do estudo | não precisa | U1, U8, U9 | — |
| 32 | Apagar o lago que tem tabela | fica | `C/apps/server/src/platform/aws.ts:279-296`; a AWS recusa a área com tabela (`C/docs/steps/trilhas/dados.md:78-80`) | `@aws-sdk/client-s3tables@3.1175.0` `ListTablesCommand.d.ts`, `DeleteTableCommand.d.ts` | nativo | Não provado: L.8 | o cartão da etapa 1 | U6, U8 | — |
| 33 | O login da empresa lê a linha do lago | fica | `C/apps/server/src/hub/lake/tables.ts:48-56`: só o operador | `GRANT SELECT (colunas)` e `CREATE POLICY` do PostgreSQL | nativo (data D10, D11) | — | H | U7 | a migração da U7 |
| 34 | O aviso de cópia parada | refeita (a parada é da ligação) | três tabelas sem uso, `C/apps/server/src/hub/notifications/tables.ts:154-234`; o e-mail, `mail.ts`, `automation-email.tsx` | `AP .../JobsHandler.kt:55-76`; `AP .../application.yml:434-437`; Nekt, `NK:12403-12404`, `NK:22357-22360`; nenhuma manda lembrete | remendo: um aviso por parada e um lembrete por dia | Lido no airbyte-platform 2.0.0 (`AP`): nenhum lembrete nos dois módulos de aviso | C; fundador, "R1 a R2 a" | U11, U12 | `apps/server/src/hub/notifications/copy-stop.ts` |
| 35 | A lista de e-mails que recebe o aviso | fica | `alert_recipient`, `C/apps/server/src/hub/notifications/tables.ts:153-172`, sem rota nem tela; `C/docs/reference/telas.md:311` | Nekt, `NK:22357-22360` | embrulhado | — | I | U13 | `apps/web/src/hub/identity/alert-recipients.tsx` |
| 36 | Os logins `conexus_sync` e `conexus_read` e a D4 | sai com o `sync`, na etapa 4 | `C/packages/hub-api/src/app-login.ts:30-40`; `C/apps/server/src/platform/copy-reader.ts:51-82` | PostgreSQL `DROP ROLE` | nativo | — | D (a) | fica de fora: etapa 4 | — |
| 37 | As gravações das formas nativas | fica | 33 gravações em `C/apps/server/src/platform/recordings/aws/` | testing T14 e T29, `C/docs/guides/testing.md:57-70`, `:85-91` | nativo | Faltam: `RunTask`, a fila, o parâmetro, o Athena | — | U5, U8, U10 | `apps/server/src/platform/recordings/aws/ecs-*.json` e os outros |
| 38 | O método para Python | fica | nenhum | não estudado | nativo | — | 0074 | fica de fora: a mudança de método antes da construção | — |

**A medida do transplante.** Nenhum código do repositório antigo entra. O adaptador e o gravador da
sonda do estudo (`sondas/adaptador-duas-classes/`) e a sonda do dicionário
(`EST/descoberta-catalogo:75-80`) são ponto de partida, e não transplante: cada um foi escrito do zero
sobre a base da sua biblioteca, e a unidade os reescreve contra os contratos deste cartão. A conversão
das células do Sankhya que a U1 tira com `copy-read.ts` (`canonical`, `QueriedPage`) é nossa; a U3 a
traz do histórico do `main` (`git show 538b0562:packages/connectors/src/sankhya/copy-read.ts`) para a
leitura por tabela, e a medida é a do arquivo: só a conversão e a página, sem a consulta guardada nem
a janela.

**A dívida.**

- A imagem em ARM, para medir depois (T.6).
- A bateria não renova a chave do dublê do HubSpot, que invalida a anterior a cada renovação: a
  renovação na tarefa fica provada só no Sankhya até a etapa 5.
- O texto da 0076 sobre o token de 32 caracteres e a frase da 0078 sobre quem tem credencial da AWS
  (T.3, T.8); a 0063, cujos modelos saem na parte 0: o fechamento da etapa os corrige.
- As tabelas das cópias de hoje no banco do Hub (`copies.copy` e as dela, as propostas) ficam vazias
  até a etapa 4, que as tira com o esquema `sync`.
- Um `RunTask` sem resposta repete com o mesmo token. Por quanto tempo a AWS guarda o token não foi
  lido: a U8 lê no tipo instalado e, se for menor que a espera da repetição, para.

## As decisões do firstmate

| # | Decisão reversível ([delivery L6](../guides/delivery.md)) | Por quê, com a evidência | Como desfazer |
| --- | --- | --- | --- |
| T.1 | O ponto de parada no depósito `S3` nativo do Meltano, num depósito da plataforma, com um prefixo por empresa que só o papel dela lê e escreve | A peça nativa: salva a cada linha de estado (`meltano@4.4.1 core/plugin/singer/target.py:100-120`) | Trocar `state_backend.uri` e passar o estado pelo parâmetro e pelo resultado |
| T.2 | A cópia do lago mora em quatro tabelas novas do esquema `copies` (`lake_copy`, `lake_table`, `lake_run`, `lake_table_run`), e não em `copies.copy` | `copies.copy` é lida pelo catálogo, pela Amostra, por Quem lê e pela liberação a Projetos como uma tabela do `sync` (`C/apps/server/src/hub/copies/catalog-view.ts`, `readers.ts`, `project-view.ts`): uma tabela do lago ali seria lida no banco da empresa. As quatro tabelas são a forma do Airbyte, a conexão, o fluxo e a rodada (`AP .../schema_dump.txt:194-217`, `:629-639`) | Uma migração que junte as linhas a `copies.copy` quando a etapa 4 tirar os leitores |
| T.3 | Quem roda o atualizar é a tarefa, depois da carga, com o papel que escreve | Um ator e um papel; o papel do Hub continua sem escrever no lago. A frase da 0078 (`C/docs/decisions/0078-how-the-lake-knows-who-reads.md:12`) fala de quem lê; o fechamento acrescenta a linha | Mover a chamada para o Hub, com o Athena no papel dele |
| T.4 | O dinheiro sem precisão declarada vira `decimal(38, 9)`; um valor que não cabe derruba a rodada | O padrão do dlt (`DLT dlt/common/arithmetics.py:18-19`) | Mudar o padrão recria a coluna |
| T.5 | Os lagos que já existem são apagados e criados de novo pelo botão da Central, depois da segunda preparação | Estão vazios; não há `UpdateStack`, e o papel do Hub o nega (`C/infra/aws/lib/hub.ts:14-20`) | Construir o `UpdateStack` nesta etapa |
| T.6 | A tarefa em sub-redes públicas, IP público, sem NAT; x86; 2 vCPU | A forma medida: 30 tabelas em 180 s com 2 vCPU, 588 s com 1 (P1) | Trocar a sub-rede e a arquitetura na definição |
| T.7 | O gravador sobre a base do singer-sdk | A base já dá o laço, o lote, o estado depois de gravar, as colunas `_sdc_*` e o decimal | Voltar ao laço escrito à mão das provas |
| T.8 | O `clientToken` é a rodada e a tentativa, até 64 caracteres; o `startedBy` leva a rodada | O limite de 36 é de `StartTask` (`@aws-sdk/client-ecs@3.1175.0 dist-types/models/models_1.d.ts:3315`, `:3330`, `:3407`) | — |
| T.9 | Um cartão em quatro partes, cada uma usada pelo fundador, e não quatro cartões | O total, ~8.700, passa a delivery L2 ("should"), mas ~3.700 são linhas tiradas da parte 0, cada parte é usada e fechada sozinha (a maior, ~3.900), que é o que a L2 pede de um lote, e as decisões são as mesmas para as quatro, aprovadas juntas em 2026-11-23 | Dividir o arquivo em quatro cartões, com as mesmas unidades; o gatilho está no orçamento |
| T.10 | O adaptador mora em `apps/extraction/tap/`, um pacote TypeScript do espaço de trabalho, ao lado do projeto Python | A trilha diz que `apps/extraction/` guarda "o tap gerado do kit" (`C/docs/steps/trilhas/dados.md:135-136`) | Mover para `packages/` |
| T.11 | O parâmetro da rodada leva a especificação inteira (`CopyTaskSpec`), no nível padrão, até 4 KB; as colunas não vão nele, a tarefa as descobre | Um lugar só para o que a tarefa recebe, cifrado; 450 colunas não cabem em 4 KB | Passar a especificação pelo ambiente da tarefa e só o segredo pelo parâmetro |
| T.12 | Uma rodada aberta há mais de 6 horas é fechada pela varredura como `COPY_TASK_LOST` | A primeira carga não foi medida; 6 horas é teto de folga (code C26), e o critério 26 mede a primeira | Mudar a constante |
| T.13 | Os códigos novos: de rodada, `COPY_LAKE_UNAVAILABLE`, `COPY_TASK_LOST`, `COPY_LAKE_WRITE_FAILED`; de marcar, `COPY_LAKE_NOT_READY`, `COPY_RUN_OPEN`, `COPY_NAME_TAKEN`, `COPY_TABLE_NOT_DECLARED` | Cada um tem uma frase diferente na tela e um dono diferente | Fundir códigos |
| T.14 | A mensagem que falha três vezes vai à fila de mortos, lida só pelo firstmate | A forma da P4; um fim perdido é fechado pela varredura | Mudar o `maxReceiveCount` |
| T.15 | O lembrete sai às 8h de São Paulo, o fuso dos relógios das cópias (`clock.ts:11-12`) | Nenhuma referência manda lembrete; o fundador disse "um lembrete por dia" sem hora | Mudar a constante |
| T.16 | Um nome por empresa: a mesma tabela de uma segunda ligação do mesmo sistema é recusada (`COPY_NAME_TAKEN`) até a etapa 6 | O nome é `<conector>_<tabela>` (`copyPrefixOf`); a etapa 6 traz a escolha de nomes | Pôr o nome da ligação no nome da tabela |
| T.17 | Sem a passada inteira de domingo: a rodada é inteira só na primeira vez e quando o estado se perdeu | A passada de domingo existe só porque o motor de hoje a tinha (`clock.ts:24-25`); o que sumiu da fonte é a pergunta da etapa 7 | Um relógio semanal da ligação com `whole` |
| T.18 | Desmarcar com a rodada aberta é recusado (`COPY_RUN_OPEN`), em vez de parar a rodada das outras tabelas | Uma rodada leva as tabelas da ligação (G); parar uma para tirar outra perde a carga das que ficam | Parar a tarefa e reabrir a rodada sem a tabela |
| T.19 | A linha do lago em `ready` é relida da AWS antes de marcar a primeira tabela de uma empresa, pelo estado da pilha | É a primeira etapa que usa o lago, e a trilha manda escolher quando reler (`C/docs/steps/trilhas/dados.md:84-88`); reler antes de agir é a forma do exemplo serverless da AWS | Reler por um relógio |
| T.20 | As tabelas das cópias de hoje e das propostas ficam no banco do Hub, vazias, até a etapa 4 | Tirá-las pede um pull request de permissões (data D11) a mais na parte 0, e os leitores que saem nas etapas 3 e 4 ainda as leem | Uma migração na parte 0 |

## O reajuste, os passos do firstmate

Antes de o G0 ser publicado, com a palavra do fundador em cada passo que muda dado. No banco do Hub
de produção, com o login do operador, só leitura:

```sql
SELECT c.company_id, c.name, c.model, c.rows,
       (SELECT count(*) FROM copies.project_copy p WHERE p.copy_id = c.id) AS projetos,
       (SELECT count(*) FROM copies.copy_reader r WHERE r.copy_id = c.id) AS papeis
FROM copies.copy c ORDER BY c.company_id, c.name;
SELECT company_id, state, count(*) FROM copies.copy_proposal GROUP BY 1, 2;
SELECT count(*) FROM copies.copy_table_left;
SELECT count(*) FROM mastra.schedules WHERE workflow_id = 'conexus-copy-run';
```

1. A consulta acima, em todas as empresas. O resultado da Metal Nobre já está nesta página.
2. Cada cópia achada sai pelo **Apagar** da página Dados, na versão no ar. Uma resposta "tabela que
   ficou" do Apagar é repetida até sair.
3. A consulta de novo: zero cópias, zero tabelas que ficaram, zero relógios do fluxo `conexus-copy-run`; e as
   contagens de pessoas, papéis, ligações, Projetos e Memória iguais às de antes. O resultado vai no
   pull request do G0 (critério 8).

## U1 O motor que cria cópia sai

**Base e modelo.** O `main` no commit em que o G0 começa. Opus: a remoção atravessa o kit, o Hub e a
tela, e o que lê o banco da empresa tem de continuar verde sem o caminho que o semeava.

### As linhas da tabela

- **Linha 1, 2, 3.** Apagar `C/packages/connectors/src/sankhya/copies.ts` inteiro e a sua entrada em
  `sankhya/definition.ts:88`; em `C/packages/connectors/src/kernel/copy.ts`, `PAGE_ROWS` (`:6`),
  `CopyDefinitionV1` (`:66-92`), `CopyModel` (`:184`), `PageInput` (`:187-199`) e `models` de
  `ConnectorCopy` (`:208-212`); `C/packages/connectors/src/sankhya/copy-read.ts` inteiro. A
  conformidade (`kernel/definition.ts:132`) deixa de conferir modelos.
- **Linha 4.** Apagar de `C/apps/server/src/hub/copies/`: `enable.ts`, `accept.ts`, `propose.ts`,
  `run.ts`, `source-pass.ts`, `sources.ts`, `whole.ts`, `schedule.ts`, `describe.ts`, `naming.ts`,
  `mode.ts` e o que deles só eles usam em `store.ts` (`modelOf`, `proposalsOf`, `sourcesNamed`) e em
  `column-state.ts`; `C/apps/server/src/builder/copy-clock/` inteiro e quem o liga (`copyClockOf` e o `releaseFirst` das cópias em
  `C/apps/server/src/conversations-of.ts:240-261`); de `C/apps/server/src/platform/copy-sql.ts`, o que escreve
  (`ensureCopyTable`, `writePage`, `closePass`, `dropAccountRows`, `dropForeignRows`, `accountRows`);
  `C/apps/server/src/hub/connectors/copy-port.ts`, `copy-proof.ts`, `list-proof.ts` e o que deles
  `builder-port.ts` expõe. Na tela, `C/apps/web/src/hub/copies/new-copy.tsx`, `copy-proposal.tsx`,
  `interval.tsx` (que a U9 traz de volta na ligação, pelo histórico) e as ações de pausar, retomar,
  intervalo, rodar e apagar de `copy-list.tsx` e `copy-detail.tsx`. No contrato,
  `packages/hub-api/src/copies.ts`: `listCopyModels`, `enableCopy`, `dismissCopyProposal`,
  `pauseCopy`, `resumeCopy`, `changeCopyInterval`, `runCopy`, `deleteCopy`, as formas das propostas,
  e `copy-proof.ts`.
- **Linha 5.** Fica: `list.ts` (a lista, sem modelos, sem propostas e sem o relógio), `readers.ts`,
  `grants.ts`, `catalog-view.ts`, `role-copies.ts`, `project-view.ts`, `sample.ts`, `read-table.ts`,
  `access-source.ts`, `platform/copy-reader.ts` e, de `copy-sql.ts`, o que eles usam (`ensureSync`,
  `syncAddress`, os nomes dos logins e do esquema). Desligar uma ligação deixa de acabar com cópias
  (não há como haver uma).
- **Linha 7.** `deleteCopy` e `dropEndedCopies` (`leave.ts:196-300`) saem com a rota; o reajuste já
  os usou.

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `packages/connectors/src/kernel/`, `sankhya/` | Apaga e muda (acima) | `apps/server/src/hub/connectors/`, `hub/copies/` |
| `apps/server/src/hub/copies/` | Apaga e muda (acima); cria `test-copies.ts`, o ajudante que semeia uma cópia do banco só nos testes | `hub/data/`, `hub/projects/`, `builder/app-data/`, `conversations-of.ts` |
| `apps/server/src/builder/copy-clock/`, `apps/server/src/conversations-of.ts` | Apaga o relógio; muda a subida e a remoção da empresa | `hub/operations/` |
| `apps/server/src/platform/copy-sql.ts` | Muda | `hub/copies/`, `platform/copy-reader.ts` |
| `apps/server/src/hub/connectors/` | Apaga `copy-port.ts`, `copy-proof.ts`, `list-proof.ts`; muda `builder-port.ts`, `public.ts` | `builder/connectors/` (U2) |
| `packages/hub-api/src/copies.ts`, `copy-proof.ts`, `index.ts`, `failures.ts` | Apaga e muda | a tela; `builder/` (U2) |
| `apps/web/src/hub/copies/` | Apaga e muda; `text.ts` perde as frases que ficam sem tela | a página Dados |
| `apps/web/sweep-copies-states.ts`, `sweep-copy-proposal-states.ts`, `scripts/server-test-seconds.json` | Muda e apaga | a QA, o `rerun-list` |

### Os contratos que a unidade cria

- Nenhuma rota, coluna nem código novo. O que se apaga está acima, com cada chamador.
- `test-copies.ts`: `seedDatabaseCopy(deps, { companyId, connector, connectionId, name, columns, rows })`,
  que grava a linha de `copies.copy` e a tabela do `sync` como `enableCopy` e a rodada faziam, só para
  os testes dos leitores que ficam (testing T5: a porta pública dos leitores é a mesma). Os testes que
  hoje ligam uma cópia por `enableCopy` ou aceitam uma proposta passam a usá-lo.
- **O arquivo modelo**: nenhum; é remoção.

### As skills e a leitura

As linhas de `packages/connectors`, `drizzle-orm` e `@mastra/core` do `stack.md`. O guia de dados,
D6 (o que sai sem migração: nenhuma tabela sai nesta unidade, T.20).

### A ordem do trabalho

1. **O kit.** Critério: 2. Apagar os modelos, a definição por consulta, `window`, `PAGE_ROWS`,
   `PageInput` e `lerPagina`. Se o `knip` acusar uma exportação do kit sem chamador (`kernel/list.ts`,
   `CopyDefinitionV2`), ela sai também; a U3 traz do histórico o que precisar.
   - **Testes:** `conformance.test.ts`, "nenhum modelo".
2. **O Hub.** Critérios: 1, 3, 5.
   - **O que sai:** as rotas e os serviços da linha 4, o relógio, a parte que escreve de `copy-sql.ts`,
     a porta das cópias de `hub/connectors/`.
   - **O que entra:** `test-copies.ts`; os testes dos leitores trocam `enableCopy` por ele.
   - **Testes:** `routes.test.ts`, "o que cria cópia saiu"; `client-deletion.test.ts`; os testes de
     hoje dos leitores, sem mudar o que esperam.
   - **Mutações à mão:** deixar a rota de `runCopy` registrada: o 1 fica vermelho.
3. **A tela.** Critério: 4. `copy-list.tsx` sem o botão e as propostas; `copy-detail.tsx` sem as ações;
   o vazio da matriz.
4. **O reajuste conferido.** Critério: 8, pelo firstmate, antes da publicação.

### Como se prova

O 1 pelas rotas do servidor de teste; o 2 pela conformidade e pelo `typecheck`; o 3 pela subida e
pela remoção de empresa; o 4 pela tela com o Hub falso; o 5 pelos testes dos leitores de hoje, que
continuam verdes com a cópia semeada. Hoje o 1 falha: as rotas existem.

### Parar se

- Um leitor que fica depende de um campo que só a rodada escrevia (`watermark`, `position`,
  `column_state`) de um jeito que o ajudante de teste não reproduz.
- O `knip` ou o `depcruise` acusam um chamador fora do raio.
- A consulta do reajuste acha uma cópia que o Apagar não apaga.

## U2 O Builder deixa de propor cópia

**Base e modelo.** A U1. Sonnet: remoção de uma ferramenta, em arquivos da outra trilha.

### As linhas da tabela

- **Linha 6.** Apagar `C/apps/server/src/builder/connectors/copy-propose.ts` e o seu teste; a entrada
  dela em `builder/connectors/connector-tools.ts`, `builder/company-tools/names.ts`, `factory.ts`,
  `builder/conversation/permissions.ts` e `builder.ts`; a forma dela em `packages/hub-api/src/tools.ts`;
  na tela, `apps/web/src/builder/conversation/copy-proposal-card.tsx` e a sua linha em
  `builder-turn.tsx`, `connector-specs.ts` e `tool-row-states`.

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/server/src/builder/connectors/`, `company-tools/`, `conversation/` | Apaga e muda | o Builder |
| `apps/server/src/builder/app-data/context.test.ts`, `conversation/data-turn.test.ts` | Muda: a cópia semeada pelo ajudante da U1 | — |
| `packages/hub-api/src/tools.ts` | Muda | a tela do Builder |
| `apps/web/src/builder/conversation/` | Apaga o cartão; muda a linha da ferramenta | a conversa |

### Os contratos que a unidade cria

- Nenhum. A linha de uma ferramenta que saiu: a conversa antiga mostra o nome guardado da chamada
  com a forma de ferramenta desconhecida que `tool-row.tsx` já tem (o caso "desconhecida no nome
  legível" de `tool-row.test.tsx:111`); se não tiver, a unidade para.

### As skills e a leitura

As linhas de `@mastra/core` e `react` do `stack.md`: a skill `mastra`. O guia de testes, T5.

### A ordem do trabalho

1. **A ferramenta.** Critério: 6. Testes: `tool-sets.test.ts` e `conformance.test.ts`, "sem
   copy_propose".
2. **A conversa antiga.** Critério: 7. Testes: `tool-row.test.tsx`, "a ferramenta que saiu".

### Como se prova

Pela lista de ferramentas de cada agente e pela tela da conversa com uma chamada antiga gravada.

### Parar se

- Uma unidade da trilha Agentes e Apps está nesses arquivos (delivery L1): espera.
- A tela não tem forma para uma ferramenta desconhecida.

## G0 O ponto de conferência

Depois da U2: os testes do kit, do Hub e da tela; o Hub local com o servidor de respostas gravadas,
a página Dados vazia, uma conversa antiga do Builder; a QA da parte 0; a consulta do reajuste em zero
no ar antes da publicação; na nuvem, o firstmate faz o passo 1 do roteiro antes de chamar o
fundador.

## U3 O kit para a cópia

**Base e modelo.** O G0 mesclado. Opus: a declaração é o contrato entre o kit, o Hub e o adaptador, e
a sessão muda quem renova no Hub e na tarefa.

### As linhas da tabela

- **Linha 8.** A declaração de cada tabela: 0080 (`C/docs/decisions/0080-copy-declared-per-table-raw-appends.md:10-13`,
  a descoberta "por um gancho ou por uma lista declarada"); a forma por tabela da Nekt
  (`NK:20888-20897`); o tamanho de página como dado da declaração, com padrão
  (`CDK .../declarative_component_schema.yaml:2244-2271`).
- **Linha 9.** O gancho do dicionário: a sonda de `EST/descoberta-catalogo:75-80` (286 linhas, no
  dublê), o que a skill do agente já sabe do dicionário (`C/packages/connectors/src/sankhya/skill/SKILL.md:49`)
  e a porta de consulta do Sankhya de hoje (`sankhya/door.ts`, `queryRequest`; `search-sql.ts`,
  `pageSql`). O mapa dos tipos do dicionário para `CopyColumnType` é o da sonda.
- **Linha 12.** Ler `C/apps/server/src/hub/connectors/limits.ts:127`, `read.ts:109-115`,
  `check.ts:43-48`. Seguir `singer-sdk@0.54.9 singer_sdk/authenticators.py:526-527`, `:609-619`.
- **Linha 13.** A classe da credencial como dado do login (0077).
- **Linha 14.** Ler `C/apps/server/src/hub/connectors/wire.ts:71`. Seguir o `JSON.parse` com
  `context.source` do Node 24 e `singer-sdk@0.54.9 singer_sdk/singerlib/json.py:40-44`.
- **Os dublês.** Ler `C/packages/connectors/src/sankhya/fake.ts:226-227` e
  `hubspot/fake-data.ts:13-68`: hoje não deixam mudar um registro. O dublê do Sankhya ganha a `TGFCAB`
  com 450 colunas, 54 `AD_`, e o dicionário dela.

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `packages/connectors/src/kernel/` | Cria `session.ts`, `exact-json.ts` e testes; muda `copy.ts`, `auth.ts`, `definition.ts`, `conformance.ts`, o índice | `apps/server/src/hub/connectors/`, o adaptador (U4), `hub/copies/` (U8) |
| `packages/connectors/src/sankhya/` | Cria `copy-tables.ts` e o teste; muda `definition.ts`, `fake.ts`, `fake-sales.ts`, o dicionário do dublê, a classe da credencial | o kit |
| `packages/connectors/src/hubspot/`, `mercado-livre/` | Muda: a classe da credencial; o HubSpot declara a tabela `deals` por operação; as rotas de teste do dublê | o kit |
| `apps/server/src/hub/connectors/` | Muda `read.ts`, `check.ts`, `limits.ts`, `wire.ts`: a sessão e o leitor do kit | `hub/data/` |

O `processo` lê um arquivo de `packages/connectors/src/<pasta>/` como da trilha do molde
(`scripts/tracks.ts`, `trackOfFile`); o pull request do G1 responde pelas duas trilhas.

### Os contratos que a unidade cria

```ts
// packages/connectors/src/kernel/copy.ts
/** A table of the source as the source names it: `TGFCAB`, `deals`. */
export const CopyTableId = z.string().regex(/^[A-Za-z][A-Za-z0-9_]{0,59}$/).brand('CopyTableId')
export const CopyColumn = z.object({ name: CopyColumnName, type: CopyColumnTypeV2, description: z.string().max(200).nullable() })
export type CopyTableDeclaration = Readonly<{
  id: CopyTableId
  label: string                                   // the kit's name, shown when the dictionary is silent
  key: readonly string[]                          // the source's key columns, in page order
  changedSince: Readonly<{ column: string }> | null
  columns:
    | { kind: 'DISCOVERED' }                      // from the connector's discover hook
    | { kind: 'DECLARED'; columns: readonly (CopyColumn & { path: string })[] }
  source: { kind: 'TABLE' } | { kind: 'OPERATION'; operation: OperationId; input: Readonly<Record<string, string | number | boolean>> }
}>
export const DiscoveredTable = z.object({ id: CopyTableId, description: z.string().nullable(), columns: z.array(CopyColumn).min(1) })
export const TablePageInput = z.object({
  table: CopyTableId, columns: z.array(CopyColumn).min(1), key: z.array(z.string()).min(1),
  changedSince: z.string().nullable(), after: z.array(z.string()).nullable(), since: Instant.nullable(),
  limit: z.int().min(1),
})
export const COPY_PAGE_DEFAULT = { rows: 500, bytes: 2_000_000 } as const
export type ConnectorCopy = Readonly<{
  tables: readonly CopyTableDeclaration[]
  page?: Readonly<{ rows: number; bytes: number }>               // default COPY_PAGE_DEFAULT
  discover?: Operation<{ tables: CopyTableId[] }, { tables: DiscoveredTable[] }, 'read'>
  readTable?: Operation<TablePageInput, CopyPage, 'read'>        // required by a TABLE source
}>
// packages/connectors/src/kernel/auth.ts
export type CredentialClass = 'SHAREABLE' | 'EXCLUSIVE'          // each login gains credentialClass
// packages/connectors/src/kernel/session.ts
export type SessionState = { kind: 'NONE' } | { kind: 'OPEN'; token: string; expiresAt: number } | { kind: 'CLOSED' }
export type Session = {
  token(signal: AbortSignal): Promise<string>
  call<T>(work: (token: string) => Promise<T>, signal: AbortSignal): Promise<T>
  close(signal: AbortSignal): Promise<void>
}
export function openSession(input: Readonly<{ auth: Auth; credential: Credential; send: ProviderSend; now: () => number }>): Session
// packages/connectors/src/kernel/exact-json.ts
export function parseExact(text: string): unknown               // a connector gains numbers: 'EXACT' | 'DOUBLE'
```

- **Cada estado** como união: `columns` e `source` por `kind`; `SessionState` por `kind` (C21).
- **Cada id** com a sua marca: `CopyTableId`, conferido pela conformidade contra a declaração (C23).
- **O dono de cada fato** (C26): a lista recomendada do Sankhya, só em `sankhya/copy-tables.ts`
  (nesta etapa, a `TGFCAB`, chave `NUNOTA`, alteração `DTALTER`); o padrão da página em `copy.ts`;
  a página do Sankhya na declaração dele, em linhas e bytes, abaixo do teto da resposta que a 0063
  mediu; a margem de renovação em `session.ts`.
- **O esquema de cada entrada externa** (C27): a resposta do dicionário, com Zod, antes de virar
  `DiscoveredTable`; uma coluna de tipo que o mapa não conhece vem como `text`, com o tipo do
  dicionário na descrição.
- **A página em bytes**: o leitor pede `limit` linhas; se a resposta passou dos `bytes`, a próxima
  pede `floor(limit * bytes / tamanho)`, nunca menos que 1; sem teto de colunas.
- **O que se apaga**: o "renova e repete" de `read.ts:111` e `check.ts:44`; o `JSON.parse` de
  `wire.ts:71`.
- **As rotas de teste dos dublês**: `POST /__teste/notas/<id>` no Sankhya e `POST /__teste/negocios/<id>`
  no HubSpot, só no modo dublê (T29).
- **O arquivo modelo**: nenhum declarado; a unidade segue C21, C23 e C26 direto.

### As skills e a leitura

As linhas de `packages/connectors` do `stack.md`. O guia de testes, T5 e T29.

### A ordem do trabalho

1. **A declaração e a conformidade.** Critérios: 10, 14.
   - **Arquivos:** muda `kernel/copy.ts`, `definition.ts`, `conformance.ts`, `auth.ts`.
   - **Testes:** `conformance.test.ts`, "a declaração por tabela" e "a classe da credencial".
2. **O Sankhya.** Critérios: 9, 11.
   - **Arquivos:** cria `sankhya/copy-tables.ts`: a lista, `descobrirTabelas` (uma consulta a
     `TDDTAB` e `TDDCAM` pela porta de consulta), `lerTabela` (a página pela `pageSql` de hoje, com a
     conversão das células trazida do histórico).
   - **Referência a seguir:** a sonda do dicionário; `EST/descoberta-catalogo:75-80`.
   - **Testes:** `copy-tables.test.ts` com o dublê, a `TGFCAB` larga e uma tabela que o dicionário
     não tem.
   - **Mutações à mão:** tirar a redução da página: a resposta larga passa dos bytes e o 11 fica
     vermelho.
3. **A sessão.** Critérios: 12, 13. Cria `session.ts`; muda `limits.ts`, `read.ts`, `check.ts`.
   - **Mutações à mão:** tirar o logout: o teste conta uma sessão aberta e fica vermelho.
4. **O número exato.** Critério: 15.
5. **Os dublês.** Critérios: 15, 16. O HubSpot declara `deals` por operação, com as colunas
   declaradas, para a bateria da U4.

### Como se prova

O 9 e o 11 pelo índice do kit contra o dublê; o 12 pela sessão contra o dublê; o 13 pelas rotas de
leitura e conferência do Hub, com os casos de hoje; o 15 por `parseExact` com o corpo em bytes, que
hoje o `JSON.parse` corta, e pela nota de 19 dígitos do dublê, que hoje o `REAL` corta.

### Parar se

- O dicionário do dublê não tem a forma da sonda, ou a sonda não trouxe o mapa de um tipo.
- Um conector de hoje depende do "repete uma vez" no Hub de um jeito que a sessão não cobre.
- O teto de bytes da resposta do Sankhya não está na 0063: o builder mede no dublê e diz ao firstmate.

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
export type TapFailure = { code: CopySourceFailureCode; table: CopyTableId; system: CopySystemMessage | null }
```

- **O nome do fluxo** é o nome no lago, `copyPrefixOf(connector) + lower(table)` (`sankhya_tgfcab`),
  feito só em `tap.ts`.
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
2. **A leitura.** Critérios: 18, 19. A sessão do kit (U3), as tabelas escolhidas em ordem, uma
   página por vez com a página do conector, `STATE` depois de cada página, a versão da passada,
   `ACTIVATE_VERSION` no fim de cada tabela. Uma passada inteira não filtra pela coluna de alteração.
   A recusa da fonte escreve `TapFailure` e sai com código 1.
   - **Testes:** `tap.test.ts` contra os dublês; `test_tap_battery.py` roda a bateria do singer-sdk.
   - **Mutações à mão:** emitir o `STATE` antes do `RECORD` da página: a bateria fica vermelha.
3. **A regra.** Critério: 20.

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

**Base e modelo.** O G1 mesclado e a mudança de método. Opus: a tarefa é o outro lado do fim da
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
  runId: CopyRunId, attempt: z.int().min(1), companyId: CompanyId,
  connector: ConnectorId, connectionId: ConnectionId, account: AccountRef.nullable(),
  credential: z.record(z.string(), z.string()),   // the opened seal; only here
  whole: z.boolean(),
  tables: z.array(z.object({ table: CopyTableId, name: CopyName })).min(1),
  lake: z.object({ bucketArn: z.string(), region: AwsRegion }),
  queueUrl: z.url(),
})
export const CopyTaskResult = z.object({
  type: z.literal('RESULT'), version: z.literal(1), runId: CopyRunId, attempt: z.int().min(1),
  outcome: z.discriminatedUnion('kind', [
    z.object({ kind: z.literal('COMPLETE') }),
    z.object({ kind: z.literal('ERROR'), code: CopyRunFailureCode, table: CopyName.nullable(), system: CopySystemMessage.nullable() }),
  ]),
  tables: z.array(z.object({ name: CopyName, read: z.int().min(0), written: z.int().min(0), rows: z.int().min(0).nullable(), whole: z.boolean() })),
})
```

- **Cada estado** como união: `outcome` por `kind` (C21). Uma rodada parada porque o parâmetro sumiu
  não manda resultado.
- **Cada id** com a sua marca: `CopyRunId`, `CompanyId`, `CopyTableId` (C23), conferidos pela U8.
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
   monta o catálogo com as tabelas da especificação escolhidas, chama `meltano run` (com
   `--full-refresh` quando `whole`), lê o resultado do leitor e as contagens do gravador por fluxo,
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

**Base e modelo.** O G0 mesclado. Sonnet: uma migração que acrescenta tabelas e uma permissão
nomeada.

### As linhas da tabela

- **Linha 18.** A forma das referências: a conexão com a agenda, o fluxo, a rodada e as contagens
  por fluxo (`AP .../schema_dump.txt:194-217`, `:629-639`); o índice de uma rodada aberta por
  cópia de hoje (`C/apps/server/src/hub/copies/tables.ts:139`), agora por ligação (0076); o teto de
  `system_code` (#1135) ao lado do de `system_message` (`tables.ts`, `copy_run_system_message`).
- **Linha 33.** Ler `C/apps/server/src/hub/lake/tables.ts:48-56`: hoje só o operador alcança a
  linha. Seguir a política e a permissão por coluna que `database-grants.sql` já usa.
- **Linha 34.** Saem `notifications.copy_follower` e `copy_notice`
  (`C/apps/server/src/hub/notifications/tables.ts:154-234`), que nenhum código lê, nesta migração: a
  conferência `copy_notice_code` repete `CopyRunFailureCode` no banco (`:35`, `:230`), e a U8
  acrescenta códigos.

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/server/src/hub/copies/lake-tables.ts` | Cria as quatro tabelas | U8 |
| `apps/server/src/hub/lake/tables.ts` | Muda: a política de leitura da empresa | `hub/lake/`; U8 |
| `apps/server/src/hub/notifications/tables.ts`, `docs/architecture.md` (as exceções do roll-back) | Apaga `copy_follower` e `copy_notice`; uma linha nas exceções (data D6) | nenhum código as lê |
| `apps/server/drizzle/`, `database-grants.sql`, a foto do catálogo | Cria a migração; muda as permissões | `migrate`; `catalog.test.ts` |
| `packages/hub-api/src/copy-shown.ts` | Muda: `SYSTEM_CODE_MAX` | U8 |

### Os contratos que a unidade cria

| Tabela | Coluna | Tipo | Restrição | Ao apagar |
| --- | --- | --- | --- | --- |
| `copies.lake_copy` | `company_id`, `connector_id`, `connection_id`, `interval`, `created_by`, `created_at` | `text`, `text`, `uuid`, `text`, `text`, `timestamptz` | chave `(company_id, connection_id)`; `interval` em `CopyInterval`; política da empresa | a ligação (`company_id, connector_id, connection_id`): `cascade`; a empresa: `cascade` |
| `copies.lake_table` | `id`, `company_id`, `connection_id`, `source_table`, `name`, `columns`, `rows`, `last_run_id`, `marked_by`, `marked_at` | `uuid`, `text`, `uuid`, `text`, `text`, `jsonb`, `bigint`, `uuid`, `text`, `timestamptz` | `UNIQUE (company_id, connection_id, source_table)`; `UNIQUE (company_id, name)`; `name` pelo padrão de `CopyName`; `columns` um array JSON | a cópia da ligação (`company_id, connection_id`): `cascade`; `last_run_id`: `set null` |
| `copies.lake_run` | `id`, `company_id`, `connection_id`, `started_at`, `ended_at`, `outcome`, `whole`, `code`, `failed_table`, `system_code`, `system_message`, `task_arn`, `attempt` | `uuid`, `text`, `uuid`, `timestamptz`, `timestamptz`, `text`, `boolean`, `text`, `text`, `text`, `text`, `text`, `integer` | `ended_at` e `outcome` nulos juntos; `outcome` em `COMPLETE`, `ERROR`, `INTERRUPTED`; código só com `ERROR`; `system_code` até `SYSTEM_CODE_MAX`; `task_arn` nulo ou `arn:aws:ecs:%`; `attempt >= 1`; índice único `lake_run_open_key` em `connection_id` onde `ended_at IS NULL` | a cópia da ligação: `cascade` |
| `copies.lake_table_run` | `run_id`, `table_id`, `company_id`, `read`, `written`, `rows`, `whole` | `uuid`, `uuid`, `text`, `integer`, `integer`, `bigint`, `boolean` | chave `(run_id, table_id)`; contagens `>= 0` | a rodada: `cascade`; a tabela: `cascade` |
| `lake.company_lake` | — | — | política `select` para o login da empresa, `company_id = <empresa da sessão>`; `GRANT SELECT (company_id, lake_id, state, account, region)` | — |

```ts
// packages/hub-api/src/copy-shown.ts, beside SYSTEM_MESSAGE_MAX
export const SYSTEM_CODE_MAX = 64
```

- O login da empresa tem `SELECT`, `INSERT`, `UPDATE` e `DELETE` nas quatro tabelas, com a política
  da empresa, como as de `copies` hoje.
- **O arquivo modelo**: `apps/server/src/hub/copies/tables.ts` (C26: as conferências nomeadas; C23:
  os ids `uuid` conferidos na leitura).
- **O dono do fato**: o teto do código ao lado do da mensagem (C26).

### As skills e a leitura

A skill `drizzle`. O guia de dados, D6, D10, D11, D15.

### A ordem do trabalho

1. **As tabelas.** Critério: 35. Testes: `lake-tables.test.ts`: a segunda cópia da mesma ligação, a
   mesma fonte duas vezes, o mesmo nome em duas ligações e a segunda rodada aberta são recusados pelo
   banco; o código longo também.
   - **Mutações à mão:** tirar o índice da rodada aberta: o teste fica vermelho.
2. **A leitura da linha do lago.** Critério: 36.
   - **Mutações à mão:** tirar a condição da empresa na política: o teste fica vermelho.

### Como se prova

Pelo `migrate` num PostgreSQL local e pelas leituras e gravações com o login da empresa. Hoje as
tabelas não existem e a empresa não vê a linha do lago.

### Parar se

- Um código de hoje ainda lê `copy_follower` ou `copy_notice`.
- A conferência de migrações recusa tirar as duas tabelas nesta migração (data D6).

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
- **Linha 19 e 10.** Marcar na ligação: a lista do kit (U3), o dicionário pelo gancho, a classe da
  credencial; o nome `copyPrefixOf` (`C/packages/connectors/src/kernel/copy.ts:16-18`).
- **Linha 31.** A lista de Dados (`C/apps/server/src/hub/copies/list.ts`) passa a ler `lake_table`.
- **Linha 32.** Ler `C/apps/server/src/platform/aws.ts:279-296` e `C/apps/server/src/hub/lake/lake.ts:149-160`,
  `:273-315`; seguir `@aws-sdk/client-s3tables@3.1175.0` `ListTablesCommand.d.ts`,
  `DeleteTableCommand.d.ts`.
- **Linha 37.** As gravações novas e as issues #1265, #1266 e #1267.

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/server/src/platform/aws.ts`, `config-aws.ts`, `test-aws.ts`, `recordings/aws/`, `scripts/` (o roteiro de gravação) | Muda: as portas `CopyTasks`, `CopyQueue`, `LakeTables`, os nomes da U6, as saídas na configuração; os dublês; as gravações | `hub/copies/`, `hub/lake/`, a QA |
| `apps/server/src/hub/copies/` | Cria `lake-copy.ts`, `lake-run.ts`, `lake-queue.ts`, `lake-routes.ts`; muda `list.ts`, `service.ts`, `routes.ts`, `public.ts` | `hub/connectors/` (desligar), a subida |
| `apps/server/src/builder/copy-clock/` | Cria de novo: o relógio da ligação | `hub/copies/` |
| `apps/server/src/hub/lake/lake.ts` | Muda: apagar o lago apaga as tabelas e as cópias do lago | `hub/operations/` |
| `apps/server/src/hub/connectors/` | Muda: desligar a ligação leva a cópia dela | — |
| `packages/hub-api/src/copies.ts`, `copy-failures.ts`, `failures.ts` | Muda: as operações da ligação, os códigos novos | U9; a outra trilha lê `CopySummary` |

### Os contratos que a unidade cria

```ts
// packages/hub-api/src/copies.ts
export const LakeTablesOfConnection = z.object({
  lake: z.discriminatedUnion('kind', [
    z.object({ kind: z.literal('READY') }),
    z.object({ kind: z.literal('NOT_READY') }),
    z.object({ kind: z.literal('UNAVAILABLE'), reason: z.enum(['NO_TABLES', 'EXCLUSIVE_CREDENTIAL']) }),
  ]),
  interval: CopyInterval.nullable(),
  tables: z.array(z.object({
    table: CopyTableId, label: z.string(), description: z.string().nullable(), columns: z.int().min(0).nullable(),
    marked: z.boolean(), name: CopyName, state: CopyTableState.nullable(),
  })),
  lastRun: CopyRun.nullable(),
})
export const SetLakeCopy = z.object({ tables: z.array(CopyTableId).max(50), interval: CopyInterval })
// GET  /api/companies/{companyId}/connections/{connectionId}/lake-tables     -> LakeTablesOfConnection
// PUT  /api/companies/{companyId}/connections/{connectionId}/lake-copy        SetLakeCopy -> LakeTablesOfConnection
//      409 COPY_LAKE_NOT_READY | COPY_RUN_OPEN | COPY_NAME_TAKEN; 422 COPY_TABLE_NOT_DECLARED; 403 FORBIDDEN (manageCopies)
// POST /api/companies/{companyId}/connections/{connectionId}/lake-copy/run    -> 202 | 200 { already: true }
CopyRunFailureCode // gains: 'COPY_LAKE_UNAVAILABLE' | 'COPY_TASK_LOST' | 'COPY_LAKE_WRITE_FAILED'
CopySummary        // a lake table: its connection, the connection's interval, rows, the last run
// listCopyRuns of a table: the connection's runs that carried it, with the table's counts

// apps/server/src/platform/aws.ts — the one adapter (C56)
export const TaskArn = z.string().startsWith('arn:aws:ecs:').brand('TaskArn')
export const RunParameter = z.string().startsWith('/conexus/copia/').brand('RunParameter')
export type CopyTasks = {
  putRun(at: Where, run: { name: RunParameter; spec: string }): Promise<AwsAnswer<void>>
  deleteRun(at: Where, name: RunParameter): Promise<AwsAnswer<void>>       // missing counts as deleted
  start(at: Where, run: { token: string; startedBy: CopyRunId; writer: string; parameter: RunParameter }): Promise<AwsAnswer<TaskArn>>
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
  z.object({ type: z.literal('ECS_STOPPED'), runId: CopyRunId, task: TaskArn, stopCode: z.string(), exitCode: z.int().nullable() }),
])
```

- **Cada estado** como união: `lake` por `kind`; a mensagem por `type`; o resultado por `kind`; o
  estado da tarefa como três literais (C21).
- **Cada id** com a sua marca: `TaskArn`, `RunParameter`, `CopyRunId`, conferido contra `lake_run.id`
  antes de fechar; `CopyTableId` conferido contra a declaração do kit no `PUT` (C23).
- **O dono de cada fato** (C26): os nomes, em `infra/aws/lib/names.ts`; o teto de 6 horas e o de
  4 KB em `lake-run.ts`; o `clientToken` `<rodada>-<tentativa>` só em `lake-run.ts` (T.8); a regra do
  nome em `copyPrefixOf`.
- **O esquema Zod de cada entrada externa** (C27): a mensagem da fila, o evento do ECS, a resposta de
  cada chamada da AWS, a resposta do dicionário.
- **Marcar** (`lake-copy.ts`): no `PUT`, numa transação, a cópia da ligação, as linhas novas e as
  desmarcadas; antes dela, a linha do lago relida (T.19) e o dicionário para as colunas; depois, o
  relógio e, se nasceu uma tabela, um disparo. Desmarcar apaga as tabelas da AWS primeiro e a linha
  depois.
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
3. **O relógio, o disparo e a varredura.** Critérios: 39, 40, 43, 45, 46.
   - **Arquivos:** cria `builder/copy-clock/` (o relógio da ligação) e `lake-run.ts`.
   - **O que entra:** a varredura das rodadas abertas da ligação; o `INSERT` recusado pelo índice; o
     dicionário para as colunas; a especificação com o selo aberto; o `PutParameter`, refeito na cota;
     o `RunTask` com o papel da empresa e o token; `task_arn` gravado. Regras: D25; S8; C50.
   - **Mutações à mão:** tirar a varredura: o 43 fica vermelho.
4. **O fim.** Critérios: 41, 42, 44, 50, 51. Cria `lake-queue.ts`. A mensagem só sai da fila depois
   do fim gravado.
   - **Mutações à mão:** tirar o `ended_at IS NULL`: a parada que chega depois reescreve o resultado e
     o 41 fica vermelho.
5. **A lista de Dados.** Critério: 49. `list.ts` e as rodadas de uma tabela leem as tabelas novas.
6. **Desmarcar, desligar e apagar o lago.** Critérios: 47, 48.
7. **Os testes na AWS.** Critérios: 46, 47, 48 (L.8, L.9).

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

## U9 A tela

**Base e modelo.** A U8. Sonnet: uma seção numa página que existe e frases em telas que existem.

### As linhas da tabela

- **Linha 19.** Ler `C/apps/web/src/hub/connectors/connection-page.tsx:207-222` (`Facts`, a seção que a
  nova segue) e `:275`; o seletor de intervalo do histórico, `apps/web/src/hub/copies/interval.tsx`;
  seguir `AP .../CatalogConverter.kt:389-397` (nada marcado) só na ideia.
- **Linha 31.** Ler `C/apps/web/src/hub/copies/copy-detail.tsx:105-109`, `:170-305`,
  `copy-facts.tsx:104-112` e `text.ts:88-89`; seguir `AP .../locales/en.json:1088-1094`.

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `apps/web/src/hub/connectors/` | Cria `lake-tables.tsx` e o teste; muda `connection-page.tsx`, `text.ts` | a página da ligação |
| `apps/web/src/hub/copies/` | Muda `copy-list.tsx`, `copy-detail.tsx`, `copy-facts.tsx`, `copy-sample.tsx`, `copy-readers.tsx`, `queries.ts`, `text.ts`, `test-hub.tsx`; volta `interval.tsx` | a página Dados; `lake-tables.tsx` |

### Os contratos que a unidade cria

- Nenhum contrato novo. Os textos, todos em `text.ts` (C26): "Tabelas no lago", "Salvar", "Rodar
  agora", "Completa · inteira", "Completa · só o que mudou", "As linhas ficam no lago da empresa.",
  "A leitura das linhas chega numa próxima etapa." e as frases da matriz de estados.

### As skills e a leitura

As linhas de `react` e das peças de `apps/web/src/ui/` do `stack.md`. O guia de web e o de desenho;
o `DESIGN.md`.

### A ordem do trabalho

1. **A seção.** Critério: 54. A lista, as caixas, o intervalo, **Salvar** e **Rodar agora**, com os
   estados da matriz.
2. **Dados.** Critério: 55. O tipo da rodada pelo `whole`; a frase do lugar; Amostra, Quem lê e
   Projetos com a frase e sem chamar o Hub.
   - **Testes:** com o Hub falso de `test-hub.tsx`.

### Como se prova

Pela tela com o Hub falso; na QA, pelo Hub local com o servidor de respostas gravadas, a 1366 e
390 px, claro e escuro.

### Parar se

- O texto de um estado precisa de uma decisão que a matriz não traz.

## G4 O ponto de conferência

Depois da U9: o Hub local com o servidor de respostas gravadas; marcar a `TGFCAB` na ligação, rodar
agora, o fim pela fila, a varredura de uma rodada antiga, desmarcar, apagar o lago; a QA da parte 1;
na nuvem, depois da publicação, o firstmate faz o roteiro 2 a 6 antes de chamar o fundador.

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
| `infra/aws/lib/` | Muda `copy.ts` (o depósito do estado), `lake.ts` (o prefixo da empresa e o grupo de consultas para o papel que escreve), `platform.ts` (o Hub apaga o prefixo de uma tabela) | o Hub, pela Release |
| `apps/server/src/hub/copies/` | Muda `lake-run.ts` (`whole` pelo modo), `lake-copy.ts` (desmarcar apaga o estado) | — |
| `apps/server/src/platform/aws.ts`, `recordings/aws/` | Muda: apagar o prefixo do estado; as gravações do Athena | — |

### Os contratos que a unidade cria

- **O estado** de uma ligação mora em `s3://<depósito do estado>/<empresa>/<ligação>/state.json`, na
  forma do Meltano, com o ponto de cada fluxo; só o papel da empresa lê e escreve o prefixo dela.
- **`CopyTaskResult.tables[].rows`** passa a ser a contagem da atual depois da atualização.
- **`CopyTaskSpec.whole`**: verdadeiro na primeira rodada de uma tabela nova e quando o estado não
  existe; falso nas outras (T.17).
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
3. **O modo no Hub.** Critério: 60.
4. **Desmarcar.** Critério: 61.
5. **Os testes na AWS.** Critérios: 57, 58, 59 (L.4, L.7), na `TGFCAB` do dublê de 450 colunas.

### Como se prova

Pelo `meltano run` com o depósito local e o dublê do Sankhya que muda uma nota (U3); na AWS, pela
conta de laboratório. Hoje a segunda rodada relê tudo.

### Parar se

- O `MERGE` do Athena sobre o `S3 Tables` recusa a forma medida, ou falha nas 450 colunas com um caso
  por instrução.
- O Meltano grava o estado antes de o gravador confirmar um lote.

## G5 O ponto de conferência

Depois da U10: o `meltano run` local com duas rodadas; o L.4 e o L.7 na conta de laboratório; a QA da
parte 2; na nuvem, o firstmate faz o roteiro 7 a 9 antes de chamar o fundador.

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
| `copies.lake_copy` | `stopped_since`, `stopped_code`, `told_at` | `timestamptz`, `text`, `timestamptz` | `stopped_since` e `stopped_code` nulos juntos; o código em `CopyRunFailureCode`; `told_at` só com parada | — |
| `notifications.copy_stop_notice` | `id`, `company_id`, `person_id`, `connection_name`, `tables`, `code`, `created_at`, `read_at` | `uuid`, `text`, `text`, `text`, `text[]`, `text`, `timestamptz`, `timestamptz` | `tables` com ao menos um nome; o código em `CopyRunFailureCode`; as políticas da pessoa, como `request_notice` | o membro: `cascade`; nenhuma chave para a ligação, que pode sair antes (data D17) |

- As permissões do login da empresa na tabela nova; em `alert_recipient` ele já tem `SELECT`,
  `INSERT` e `DELETE` (`C/apps/server/database-grants.sql:456`).
- **O dono do fato**: os códigos, `CopyRunFailureCode` de `hub-api` (C26).

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
| `apps/server/src/hub/notifications/` | Cria `copy-stop.ts`, `copy-stop-email.tsx`; muda `notifications.ts`, `notification-render.d.mts` | `hub/copies/lake-queue.ts`, `lake-copy.ts` |
| `apps/server/src/hub/copies/lake-queue.ts`, `lake-copy.ts`, `list.ts` | Muda: `closeLakeRun` anota e tira a parada; a lista e a seção mostram a parada | — |
| `apps/server/src/builder/copy-clock/` | Muda: o relógio do lembrete | — |
| `apps/server/package.json` (o `build` dos e-mails com `esbuild`), `.gitignore` | Muda: o segundo modelo de e-mail | a Release |
| `packages/hub-api/src/copies.ts`, `notifications.ts` | Muda: `stopped`; o aviso no sino | a tela |
| `apps/web/src/hub/copies/`, `hub/connectors/lake-tables.tsx`, `hub/notifications/bell.tsx` | Muda: a marca **Parada**; a linha no sino | — |

### Os contratos que a unidade cria

```ts
// packages/hub-api/src/copies.ts
CopySummary, LakeTablesOfConnection // gain: stopped: z.object({ since: z.iso.datetime(), code: CopyRunFailureCode }).nullable()
// packages/hub-api/src/notifications.ts — the bell gains one kind
z.object({ kind: z.literal('COPY_STOPPED'), connection: z.string(), tables: z.array(CopyName).min(1), code: CopyRunFailureCode })
// apps/server/src/hub/notifications/copy-stop.ts — called inside closeLakeRun's transaction; the mail goes after the commit
export function stopped(tx: CommandTx, run: { companyId: CompanyId; connectionId: ConnectionId; tables: CopyName[]; code: CopyRunFailureCode }): Promise<'OPENED' | 'ALREADY_OPEN'>
export function recovered(tx: CommandTx, run: { companyId: CompanyId; connectionId: ConnectionId }): Promise<'CLOSED' | 'WAS_RUNNING'>
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
firstmate faz o roteiro 10 antes de chamar o fundador, e a etapa fecha (delivery L19).
