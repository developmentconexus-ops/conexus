# O catálogo de padrões e de tipos de página

Estado: **aprovado em 2026-11-17**: os onze tipos de página, os padrões e os quatro estados, e as ações da linha, uma à vista e o resto no menu. Aprovar a lista não aprova o desenho de nenhum padrão.

Este documento é parte da camada de produto. O Conexus já tem as três camadas de baixo de um
design system: os valores (`DESIGN.md`), as peças básicas (`apps/web/src/ui/`) e as peças compostas (a
fundação do front-end). Faltam as duas de cima, que são onde uma tela nova mais diverge:

- **Padrão**: a solução de uma tarefa, feita de peças: combinações reutilizáveis de componentes que
  levam a pessoa a um objetivo.
- **Tipo de página**: a forma de uma tela inteira, o que os sistemas de design chamam de páginas ou
  modelos.

Uma tela nova escolhe um tipo de página e os padrões que ele pede. Só desenha de novo o que o catálogo
não tem, e o que desenhar de novo entra aqui como proposto.

## 1. O estado de um padrão

Quatro estados, como os sistemas de design usam para as suas peças.

| Estado | Quer dizer |
| --- | --- |
| **proposto** | está neste catálogo, com receita; nenhuma tela o segue inteiro ainda |
| **experimental** | uma tela o segue, e ele tem exemplo na vitrine; pode mudar |
| **estável** | duas telas ou mais o seguem, e o fundador usou; mudar pede cartão |
| **descontinuado** | há outro no lugar; nenhuma tela nova o usa |

Nenhum padrão abaixo nasce estável. Estável se ganha em uso.

## 2. Os tipos de página

Onze tipos. Cada um existe em pelo menos uma referência, ou já existe no Conexus.

| # | Tipo | A receita, de cima para baixo | Telas de hoje | Nas referências |
| --- | --- | --- | --- | --- |
| `T1` | **Lista** | cabeçalho (título, uma frase, a ação principal); busca e filtros; a tabela ou as linhas; o vazio | Integrações, Agentes, Automações, Todos os projetos, Pessoas e convites, Papéis, Ferramentas, Clientes | a lista de execuções de uma plataforma de dados; as listas de agentes e de trabalhos |
| `T2` | **Detalhe com abas** | a trilha; o título com o estado; as ações à direita; as abas; o conteúdo da aba; um painel de fatos ao lado | uma tabela de Dados, uma ligação, uma automação, uma ferramenta, Sobre | o detalhe de uma fonte com 5 abas; o de uma tabela com 8 abas |
| `T3` | **Navegador** | a árvore com busca na coluna; à direita a lista da pasta aberta, como uma Lista | Dados | o catálogo de dados das plataformas de dados |
| `T4` | **Tabela de dados** | a contagem; busca e filtro na grade; cabeçalho fixo com o tipo da coluna; linhas densas; número à direita; a paginação | a Amostra, as linhas de uma tabela do app, as linhas de uma cópia liberada | a amostra de dados de uma tabela; as grades de dados das referências |
| `T5` | **Seção de configurações** | o título e uma frase; as seções, cada uma com o nome e a explicação à esquerda e o controle à direita | as seções de Configurações, nos grupos do mapa 6.4: Você; e a empresa por tarefa (Geral, Pessoas e acesso, Modelos, Avisos e uso). O que a pessoa comum não precisa decidir fica num "Avançado" (P21) | as configurações de uma plataforma de dados e as de uma referência de agentes |
| `T6` | **Passos** | o progresso; o título do passo; um pedido por passo; Voltar e Continuar; o resumo do que vai ser criado antes do último | a Primeira entrada (no alvo de JB5: apelido, conta de modelo, equipe, Ligue seus sistemas, e a conversa da entrada, que é uma Bancada); Ligar um sistema | a ligação de uma fonte em 7 passos; a ingestão em 5 passos; janelas em cadeia |
| `T7` | **Conversa** | a lista de conversas na coluna; a conversa no eixo; o compositor embaixo | o Início, uma conversa com o Assistente | a conversa com os dados de uma plataforma; a página de um agente |
| `T8` | **Bancada** | a coisa em construção de um lado, a conversa do outro, as abas da coisa no alto | Construir (Prévia e Código com a conversa); um agente (a configuração com as conversas); o arquivo ao lado da conversa | a página de um agente em três colunas com a configuração; a conversa com o painel de configuração; a conversa guiada com o painel de saída |
| `T9` | **Visão geral** | o que precisa de atenção primeiro; depois o que há, em blocos com a saída de cada um | o Início (Continuar, Projetos, Ligações); o Estado do Hub | a visão geral de uma plataforma de agentes; a de uma plataforma de dados |
| `T10` | **Coluna pública** | a marca; um título; um pedido; uma ação; a saída para a outra tela pública | Entrar, Esqueci a senha, Definir senha, o convite | a tela de criar o espaço de trabalho |
| `T11` | **Página de mensagem** | uma frase do que houve; uma frase do que fazer; uma ação | não encontrado, erro do servidor, o app recusa a passagem (com "peça a quem administra a empresa", sem nome; decisão E3 b) | as páginas de mensagem dos serviços públicos: página não encontrada, problema com o serviço, serviço indisponível |

Conversa e Bancada são os dois tipos que as referências de dados não têm e as de agentes têm. São o
que o Conexus tem de próprio.

## 3. Os padrões

Vinte e um padrões (os três da moldura, P19 a P21, vieram do mapa e das decisões das Configurações). "Peças" diz o que já existe em `apps/web/src/ui/`; "(fundação)" marca o que as unidades U3 a U5 do
cartão da fundação criam.

### 3.1 Da página

| # | Padrão | Quando | A receita | Peças | Estado |
| --- | --- | --- | --- | --- | --- |
| P1 | **Cabeçalho de página** | toda página dentro da moldura | o título; embaixo uma frase que diz o que a página guarda; à direita a ação principal, uma só (a ficha de cada tela, em [as telas](telas.md), diz qual). Dentro de um Projeto, o título leva o nome dele (E7, a regra do nível do [mapa](../explanation/mapa.md), seção 5). No celular, o estado e a versão continuam à vista | `PageTitle`; `PageHeader` (fundação) | proposto |
| P2 | **Trilha** | a página está dois níveis ou mais abaixo do trilho | Área › pai › esta página; o último não é link | hoje só em Dados | proposto |
| P3 | **Abas no endereço** | um Detalhe com mais de uma visão | as abas sob o título; a aba fica no endereço; a contagem ao lado do nome quando ajuda | `Tabs` | experimental (Dados) |
| P4 | **Painel de fatos** | um Detalhe tem fatos curtos que valem em toda aba | à direita, pares de nome e valor; valor exato em mono | hoje só em Dados ("Detalhes") | proposto |

### 3.2 Da lista

| # | Padrão | Quando | A receita | Peças | Estado |
| --- | --- | --- | --- | --- | --- |
| P5 | **Linha de lista** | toda lista de coisas com estado | o nome; o estado em palavra; um ou dois fatos (quando, de quem; numa lista de coisas que rodam, a última vez que rodou e como terminou); a linha inteira abre o item | `List`, `Row`, `Table` | proposto |
| P6 | **Ações da linha** | uma linha tem mais de uma ação | no máximo uma ação à vista (a de todo dia, de preferência uma chave); as outras num menu "…"; a perigosa só no menu | `DropdownMenu`, `Switch` | proposto |
| P7 | **Busca e filtro** | a lista pode passar de uma tela | a busca à esquerda; os filtros ao lado; o que está ligado fica no endereço | `SearchField` (fundação) | proposto |
| P8 | **Escolher da lista** | escolher um entre muitos (um Projeto, um modelo, uma ligação) | um botão que abre a lista; busca a partir de 7 itens; "Mais"; o vazio; o erro | `Picker` (fundação U3), sobre o `Combobox` | experimental (fundação) |
| P9 | **Mais itens** | a lista tem mais do que uma página | "Mais" no fim, ou o paginador numa Tabela de dados | `Pager` | proposto |

### 3.3 Dos estados

| # | Padrão | Quando | A receita | Peças | Estado |
| --- | --- | --- | --- | --- | --- |
| P10 | **Vazio e primeira vez** | a lista não tem nada | uma frase do que vai aparecer aqui; a ação que cria a primeira coisa, a mesma do cabeçalho | `Empty` | proposto |
| P11 | **Carregando** | a página espera o servidor | a moldura na hora; o esqueleto só no conteúdo | `Loading`, `Skeleton` | estável em regra (web W34), proposto em uso |
| P12 | **Falha e não encontrado** | a leitura falhou, ou o endereço não existe | a frase do que houve; "Tentar de novo" na falha; "Voltar ao início" no não encontrado. Dentro de um Projeto que não existe, sem o menu do Projeto ao lado | `Failure`, `ReadFailure`, `NotFound` | estável em regra (web W34, código C48), proposto em uso |
| P13 | **Fora do papel** | a pessoa vê a página mas não pode a ação | a ação à vista, desligada, com quem pode | `Button` desligado com a frase | estável em regra (web W34, design V29) |
| P14 | **Estado em palavra** | qualquer coisa que tem estado | a palavra; um ponto da cor ao lado; nunca só a cor | `Badge`, `Stamp` | experimental |

### 3.4 Do dado e da ação

| # | Padrão | Quando | A receita | Peças | Estado |
| --- | --- | --- | --- | --- | --- |
| P15 | **Origem do dado** | um número ou uma linha veio de um sistema | a logo do sistema; "Sistema · ligação"; a tabela em mono; o carimbo com a hora da cópia, ou "ao vivo" | a logo na placa; `Stamp` | proposto (aprovado no desenho das Fontes, 2026-11-16) |
| P16 | **Confirmar o que não tem volta** | apagar, desligar, publicar, liberar um dado, recusar um convite | a janela diz o que sai e de onde; o botão final leva o verbo; só ele é vermelho. Atos parecidos confirmam igual: publicar pede a mesma mensagem de versão em todo lugar (E4) | `AlertDialog` | experimental (design V55) |
| P17 | **Seção de configuração** | uma preferência ou um fato da empresa | o nome e a explicação à esquerda; o controle à direita; uma chave ou uma escolha salva na hora, um texto pede Salvar; o que salva sozinho diz "Salvo" depois que o servidor confirma (E5). Um só modo por tipo de controle em todo o Hub (E7) | `SettingsSection`, `Switch` | experimental |
| P18 | **Formulário** | a pessoa preenche mais de um campo | o rótulo em cima; a ajuda embaixo; o erro no campo; um botão com o verbo; dois cliques, um pedido | `Form`, `Field` (web W23, W24) | experimental |

### 3.5 Da moldura

Nascem do mapa aprovado. São da moldura, e valem em toda área.

| # | Padrão | Quando | A receita | Peças | Estado |
| --- | --- | --- | --- | --- | --- |
| P19 | **Coluna do lugar** | o lugar aberto tem uma lista ou uma árvore (mapa, seção 4) | cerca de 240 px; a marca e o nome do lugar numa linha só no alto; o botão de recolher à vista, com dica e Ctrl+B; recolhida, mostra os ícones do lugar; o estado fica guardado no navegador | `Sidebar` (shadcn) | proposto (decidido no mapa, seção 5.3) |
| P20 | **Menu do Projeto em grupos** | dentro de um Projeto | os grupos O app; Agentes; Dados; O Projeto, nesta ordem; cada item no nível do Projeto, sem repetir o trilho | `SidebarGroup` | proposto (decidido no mapa, seção 5) |
| P21 | **Avançado recolhido** | uma escolha que tem um padrão bom e que a pessoa comum não precisa fazer | fica dentro de "Avançado", fechado; mostra o padrão em uso ("Automático") | `Collapsible` | proposto (decisão E2 b) |

### 3.6 Da conversa

Os padrões da conversa com um agente já têm dono: são as peças de IA da unidade U5 da fundação (a
linha de trabalho, o raciocínio dobrado, a linha de ferramenta, o plano e as tarefas, a aprovação de
uma escrita, a pergunta à pessoa, as fontes). O catálogo cita essa lista e não a repete. O que este catálogo
acrescenta é só o tipo de página onde elas moram: Conversa e Bancada. A conversa da primeira entrada
(alvo de JB5) é uma Bancada: a pergunta à pessoa com opções, a proposta com Salvar, e ao lado as páginas
que acendem, como numa plataforma de dados com conversa guiada.

## 4. De onde cada padrão vem

| Padrão | A referência | O defeito de hoje que ele responde |
| --- | --- | --- |
| P1 Cabeçalho | o cabeçalho de página compartilhado de uma referência de código aberto; o mesmo arranjo escrito 5 vezes no Conexus | cada tela arruma o título e a ação do seu jeito |
| P5 e P6 Linha e ações | uma referência de agentes, nas automações: a ação de todo dia na chave, a perigosa no menu | Automações e Pessoas com 3 botões por linha, "Apagar" vermelho sempre à vista |
| P7 Busca e filtro | as plataformas de dados: filtros acima da tabela | a tabela de dados não tem busca, filtro nem ordem; 7 campos de busca escritos de 4 jeitos |
| P8 Escolher da lista | a unidade U3 da fundação | o seletor de Projeto escrito 5 vezes |
| P10 Vazio | as plataformas de dados: ícone, uma frase, o botão de criar | o vazio de Agentes é só uma frase na linha da tabela, com "Novo agente" só no cabeçalho |
| P12 Falha | as páginas de mensagem dos serviços públicos | o erro de servidor em Projetos sem "Tentar de novo"; uma ligação inexistente cai em Conversas |
| P15 Origem | o protótipo das Fontes; as plataformas de dados | o caso Fontes: a logo, a ligação e a cor da cópia parada se perderam no cartão |
| `T4` Tabela de dados | uma plataforma de dados: linhas de 25 px, o tipo na coluna, o número à direita | linhas de 45 a 80 px, tudo em mono, sem busca |
| `T5` Configurações | uma referência de agentes: linhas com a chave à direita | um campo e um botão cinza desligado |
| P1 Cabeçalho, o nome do Projeto | a regra do nível do mapa, seção 5 | 9 telas dentro do Projeto sem o nome dele (`apps/web/src/hub/projects/area.tsx`) |
| P5 Linha, a última vez | uma referência de agentes, a automação com histórico | Automações, Clientes e Projetos sem a última execução ou atividade |
| P13 Fora do papel | o agente já faz certo | em Integrações, Dados e no Projeto a ação some (`apps/web/src/hub/connectors/integrations.tsx`) |
| P15 Origem | o protótipo das Fontes | linhas no Projeto sem fonte nem hora |
| P16 Confirmar igual | design V55 | liberar cópia sem janela; Publicar do Construtor sem mensagem; recusar convite sem confirmar |
| P17 Salvar | design V29 e E5 | três modos de salvar: botão, ao mexer, ao sair do campo sem "Salvo" |
| P19 Coluna do lugar | duas referências de agentes: 240 px aberta e 56 ou 64 px recolhida, com ícones | 328 px, sem botão de recolher, recolhida some inteira (mapa, seção 5.1) |
| P21 Avançado | a documentação do Mastra trata "auto" como padrão | "observador" e "refletor" à vista de todos |

## 5. Como o catálogo cresce

- Um padrão novo nasce no estudo de uma área, como proposto, com a referência.
- Passa a experimental quando a primeira tela o segue e a vitrine o mostra.
- Passa a estável quando a segunda tela o segue e o fundador fechou a etapa usando.
- O cartão de uma tela diz o tipo de página e os padrões que usa. A revisão procura o padrão refeito.
