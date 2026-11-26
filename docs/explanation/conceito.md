# O conceito do Conexus

Estado: **aprovado em 2026-11-17**, com o ajuste da língua (seção 8). A primeira versão caiu no mesmo dia: o fundador refez o conceito (seção 1).

Este documento abre a camada de produto, junto de [o mapa](mapa.md), [as jornadas](jornadas.md), [as telas](../reference/telas.md), [o catálogo](../reference/catalogo.md) e [a folha de movimento](../reference/movimento.md). Ele diz o que o Conexus é, para quem, o que a
pessoa deve conseguir em cada área, e os princípios de experiência que qualquer tela tem de passar. O
`PRODUCT.md` continua curto e passa a citar este documento. A cor, a letra e as peças são do
`DESIGN.md`. O que o produto nunca faz é da [VISION.md](../../VISION.md); aqui só se cita.

## 1. O conceito

As palavras do fundador, em 2026-11-17, ao recusar a primeira versão ("temos que refazer
essa ideia arcaica que tínhamos"):

> "o conceito do conexus mudou por isso que agora temos conexus data and context, conexus agents.
> Porque não é apenas para empresa média com um ERP é para empresas, industria, que tem vários dados,
> conectores, sistemas desconexos e trazer isso tudo para uma camada de ontologia e conhecimento para
> centralizar não somente dados, mais o conhecimento de como a empresa opera e facilitar automações,
> implementação de inteligência artificial, análise de dados e criação de aplicativos para facilitar
> processos, análises e personalizações específica para empresa e tudo isso alimentado por uma base
> de contexto e ontologia que vai aprendendo e se atualizando. Pode ter quem programa e quem não
> programa, não é um delimitador."

Numa frase:

> O Conexus junta os dados, os sistemas e o conhecimento de como a empresa opera numa camada de
> contexto e ontologia que aprende com o uso. Sobre ela a empresa analisa, automatiza, põe a
> inteligência artificial para trabalhar e cria os apps que os seus processos pedem.

O que muda em relação ao que o repositório diz hoje:

| Hoje no repositório | O conceito novo |
| --- | --- |
| O centro é o app, pedido em português: "A person asks the Builder, in Portuguese, for a business app" (`PRODUCT.md`) | O centro é a camada de contexto e ontologia. O app é uma das quatro coisas que a empresa faz sobre ela |
| Para "people ... who are not developers" (`PRODUCT.md`, Users) | Para quem programa e para quem não programa |
| A empresa com um ERP | Empresas e indústrias com vários dados, conectores e sistemas desconexos |
| A língua portuguesa como traço do produto | A língua não delimita o produto: hoje o texto visível é português (delivery L23); a tradução (i18n) é um plano do fundador para não ficar só no Brasil |
| O dado copiado e o catálogo | O dado e também o conhecimento de como a empresa opera |
| O contexto é o que cada agente recebe | O contexto é uma base da empresa, que aprende e se atualiza |

## 2. Para quem

Empresas e indústrias com muitos dados, vários conectores e sistemas que não conversam entre si. Com
gente que programa e gente que não programa. A primeira é a do fundador (`docs/roadmap.md`, resposta
4: "Sua empresa primeiro, as outras depois").

| Pessoa | O que faz no Conexus | Papel hoje |
| --- | --- | --- |
| Quem prepara a empresa | Liga os sistemas, convida as pessoas, decide quem lê o quê, aprova o que entra no contexto, publica | Dono, Administrador |
| Quem conhece a operação | Pergunta, propõe conceitos e regras, pede um app, usa os apps. Pode não programar | Membro |
| Quem monta | Cria agentes, ferramentas e automações num Projeto; lê e acompanha o código. Pode programar | Desenvolvedor (e Dono, Administrador) |
| Quem só usa um app | Abre o app. Do Hub vê só "Seus apps" | pessoa com acesso a um app |
| Quem opera a instalação | Cadastra empresas, vê o estado do Hub | o fundador, pela Central |

Não há persona com nome. Os estudos trazem papéis, e não há cliente ainda. Este documento não inventa uma.

## 3. O que a empresa consegue, área por área

Cada linha é um resultado para a pessoa. "Hoje" diz o que o `main` já entrega: **tem**, **parte** ou
**falta**. "Marco" diz onde o roteiro o traz. Nenhum resultado é novo: cada um já está no roteiro, na
trilha ou numa decisão gravada.

### 3.1 Dados e contexto: a base

| # | A empresa consegue | Hoje | Marco ou decisão |
| --- | --- | --- | --- |
| `C1` | Ligar os seus sistemas pela tela, sem colar chave, e ver cada um funcionando ou parado | parte: Sankhya, Mercado Livre e HubSpot ligam; o login pelo kit é o `D1` | `D1`, `D3` (onze sistemas com a mesma prova) |
| `C2` | Ver todo o dado copiado num catálogo só: cada tabela com nome, descrição, colunas, de quando é e quem lê | tem: Dados, com Visão geral, Colunas, Amostra, Rodadas e Quem lê | `D2` |
| `C3` | Dar nome ao que a empresa chama de pedido, cliente, margem: os conceitos, cada um ligado às tabelas e provado com uma consulta | falta: a pasta Negócio existe, vazia | a etapa do Negócio e `D4`; decisões 0064 e 0067 |
| `C4` | Guardar como a empresa opera: as regras, os processos, as exceções, em páginas que todo agente segue | parte: Memória da empresa, hoje nas Configurações | o Brain, decisão 0065 |
| `C5` | Ver o contexto aprender: um agente ou uma pessoa propõe um conceito ou uma nota, e ele vale quando alguém aprova | falta | 0064 (`B1`: "nothing counts before a person approves it"); a revisão semanal, que só propõe |
| `C6` | Saber quem leu o quê, e decidir o que cada papel lê | parte: Papéis e Quem lê; o Registro de dados está em construção | o Registro e a conformidade |
| `C7` | Confiar no que vê: a prova de cada conceito refeita todo dia, com aviso quando quebra | falta | a saúde da Ontologia (trilha Dados, item 3) |

### 3.2 Agentes: a inteligência artificial trabalhando sobre a base

| # | A empresa consegue | Hoje | Marco ou decisão |
| --- | --- | --- | --- |
| G1 | Perguntar na própria língua e receber a resposta com de qual sistema veio e de quando é | parte: o Assistente responde; o bloco Fontes foi redesenhado em 2026-11-16 | `D2`, `A6` |
| G2 | Perguntar pelo conceito da empresa, e não pelo nome da tabela | falta | `D4` |
| G3 | Analisar: o Assistente lê as linhas, calcula e mostra o arquivo ao lado da conversa | tem | `A6` |
| G4 | Criar um agente para um trabalho da empresa, conversando, com as ferramentas e as ligações que ele pode usar | tem: o Construtor, os agentes e as ferramentas do Projeto | `A5` |
| G5 | Automatizar: um horário inicia o trabalho | tem: Automações | 24.6, congelada |
| G6 | Automatizar por acontecimento: um registro novo no sistema inicia o trabalho | falta | `D5` |
| G7 | Deixar o agente escrever no sistema com a aprovação de uma pessoa, ou sozinho quando a empresa decidir | tem: o cartão "Aprovar?", Pergunta antes e Faz sozinho | `D1` |
| G8 | Ter todo agente seguindo o mesmo conhecimento da empresa | falta | trilha Dados, item 7 |
| G9 | Ver o que cada agente fez | falta | 21.1, a Atividade |

### 3.3 Apps: os processos da empresa virando tela

| # | A empresa consegue | Hoje | Marco ou decisão |
| --- | --- | --- | --- |
| A1 | Pedir um app conversando, ver a prévia e publicar | tem | · |
| A2 | Aprovar o plano antes de qualquer código, e ver cada pedido conferido no fim | falta | `A3` |
| A3 | Receber um app que funciona: o Builder vê o que construiu e conserta sozinho | falta | `A1` |
| A4 | Receber um app com a cara da empresa | falta | `A2` |
| A5 | Ter o app lendo o dado e os conceitos da empresa pelo mesmo contrato dos agentes | parte: as cópias liberadas; os conceitos vêm depois | `D2`, 0064 (`M`) |
| A6 | Decidir quem usa cada app, por papel, e voltar a uma versão | tem: Quem usa o app, Versões | · |
| A7 | Para quem programa: ler o código, ver o que mudou, acompanhar | parte: a aba Código; a aba Alterações está em web W31 e ainda não existe | · |
| A8 | Um segundo olhar antes da entrega | falta | `A4` |

## 4. Os princípios de experiência

Sete princípios. Cada um se testa numa tela, com sim ou não. Cada um junta regras que o produto já
afirma em lugares diferentes, ou um defeito que os estudos mediram.

| # | Princípio | O teste numa tela | De onde vem |
| --- | --- | --- | --- |
| E1 | **O dado mostra de onde veio e de quando é.** | Todo número ou linha que veio de um sistema tem ao lado a fonte e a hora. O que não se sabe aparece como "indisponível", nunca como zero. | `VISION.md` ("O dado é verdadeiro e diz de onde veio"); roteiro `D2`; o caso do bloco Fontes |
| E2 | **O contexto é um só, e aprende com aprovação.** | Um conceito ou uma regra da empresa aparece com quem aprovou e quando. O que um agente aprendeu aparece como proposta, não como fato. Agente e app citam o mesmo conceito. | As palavras do fundador de 2026-11-17 ("uma base de contexto e ontologia que vai aprendendo"); decisões 0064 e 0065 (`B1`) |
| E3 | **A conversa cria; a tela guarda.** | Tudo que nasce numa conversa (app, agente, automação, cópia, conceito) tem uma linha numa lista, com estado e dono, e se abre sem reler a conversa. | `PRODUCT.md` ("Creation by conversation"); o inventário: a lista de Automações não mostra a última execução |
| E4 | **Nada age sem dizer antes.** | Toda escrita, publicação ou remoção mostra, antes do clique final, o que vai acontecer e onde. Depois, a tela diz quem aprovou. | "It never publishes on its own"; roteiro `D1` ("Uma escrita mostra o cartão"); design V55 |
| E5 | **O estado é uma palavra, e é o do servidor.** | Todo estado tem palavra, e a cor só acompanha. Nenhuma tela diz "pronto" antes de o servidor confirmar. | design V35 e V54; "never simulates progress"; web W34 |
| E6 | **Cada pessoa vê o que usa, e sabe quem pode o resto.** | Nenhum item de menu leva a "sem permissão". Uma ação fora do papel fica à vista, desligada, e diz quem pode. | web W34; design V29; o agente lê com o papel de quem pergunta |
| E7 | **Uma coisa, um nome, um lugar.** | O mesmo nome não aparece em dois níveis sem dizer o nível. A mesma escolha usa a mesma peça em toda tela. Nada aparece como "em breve". | O seletor de Projeto escrito 5 vezes; o menu do Projeto repete o trilho; duas "Memórias" nas configurações; web W31 |

A Pauta já diz como o Conexus parece. Isso é direção visual e continua no `DESIGN.md`.

## 5. O que o Conexus nunca faz

Dono: a [VISION.md](../../VISION.md).

## 6. O que o conceito novo pede do repositório

Entrou no pull request que trouxe estes documentos, com a palavra do fundador de 2026-11-17.

- `PRODUCT.md`: "Users" (hoje "who are not developers"), "Product Purpose" e "Positioning".
- `docs/architecture.md`, seção 1: a abertura, que hoje fala só do app.
- `docs/roadmap.md`, "O que o Conexus é": as palavras de 2026-11-09 ficam como história; as de
  2026-11-17 entram.
- `PRODUCT.md`, "Users" e "Product Purpose": tirar "in Portuguese" e "writing in Portuguese" como traço do produto; a regra de hoje, texto visível em português, continua em delivery L23 até haver i18n.
- "Not ... a database console" e "drag-and-drop" continuam verdade.
- `docs/guides/web.md`, regras que o mapa, as jornadas, o catálogo e a folha de movimento mudam:
  - **W30** (o trilho): a ordem do trilho decidida no mapa e a coluna do lugar.
  - **W31** (o Projeto): o menu em grupos do mapa, seção 5; "Versão" no alto só entra se a E16 for (b), e ela segue em aberto.
  - **W32** (Configurações): os grupos por dono e por tarefa do mapa 6.4, e o "Avançado" da decisão E2 (b).
  - **W33** (a primeira entrada): hoje fixa quatro passos; o alvo de JB5 tem "Ligue seus sistemas" e a
    conversa. A regra descreve esse alvo e entra com o item 6 do Brain.
- `DESIGN.md` e o guia de design (V26): a folha de movimento aprovada.

## 7. O que fica aberto, e não é decidido aqui

- Os nomes finais das três áreas na tela. O fundador escreve "Conexus Data and Context" e "Conexus
  Agents", e disse "pode deixar assim por agora". Este documento usa Dados e contexto, Agentes e Apps.
- Se o Supervisor do Início (decisão E1 de 2026-10-30) é o Assistente com outro nome ou outro
  agente. É do estudo do marco `A6`.

## 8. A língua

O fundador, em 2026-11-17, sobre o resultado G1: "NÃO FOCARIA no português não, tanto que tenho um
plano no futuro de implementar i18n para não nos limitar apenas a Brasil" (grafia corrigida).

O que isso muda aqui: nenhum resultado e nenhum princípio fala em português. O que fica como está: o
texto visível do Hub é português hoje, pela regra delivery L23, e o conteúdo das capturas também. A
tradução não tem marco no roteiro. Quando tiver, o catálogo de padrões ganha a regra do texto (datas,
números e moeda pela língua da pessoa); hoje isso não é decidido.
