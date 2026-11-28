# Trilha Agentes e Apps

O fundador, em 2026-11-14, ao parecer do conselheiro de produto: "1A. Duas trilhas", "3B. Identidade
da empresa mais direção por app" e "4A. Build semanal fixo". Esta página não é um cartão de etapa
(delivery L5). Ela diz o que a trilha possui, qual é o primeiro marco e como ela pede dados à
outra trilha. Os marcos, em ordem, estão no [roteiro](../../roadmap.md).

## O que a trilha entrega, e para quem

A trilha Agentes e Apps entrega para a pessoa que conversa com o Conexus e para a pessoa que usa o
app. O sucesso se mede nos dois apps de teste do fundador, julgados por ele. Toda quinta, o Builder
da semana reconstrói os dois com modelo real e os mesmos dois pedidos, e o fundador abre e julga.

## O primeiro marco

| Marco | O que a pessoa vê | Pronto quando |
| --- | --- | --- |
| **`A1`. O Builder vê o que construiu** | Menos apps "prontos" que não funcionam | Um teste planta um defeito visível e o Builder o corrige sem ninguém avisar. A conferência falha quando uma tela não está ligada. O estudo curto que compara máquina e Worker de verdade está feito antes |

Dentro de `A1` entra a medida que falta: construir os dois apps de teste com Claude dentro do Builder,
uma vez. Sem ela, não dá para separar defeito do agente de defeito do app. A trilha segue o método
completo.

## Os apps de teste e as capacidades

O fundador é a régua: "eu prefiro eu ser a régua". Os apps de teste: um CRM e um acompanhamento de
vendedor; o gestor vê tudo de cada vendedor; o vendedor entra e vê os seus dados, metas, marcas,
desempenho, clientes e sugestões. Nada de app de brinquedo. O mapa sai: "Deixa quieto sobre o Mapa".

- **Capacidade 4. As pessoas do app e o vendedor.** Entra como vendedor de teste, ligado ao vendedor do ERP, e vê só o seu.
- **Capacidade 5. O design da empresa.** Abre a identidade de design da empresa em DESIGN.md (cores, fontes, formas; as cores dos gráficos saem dela), e a skill de design do Builder faz um app novo nascer com ela. O plano de cada app traz também a direção de design dele.
- **Capacidade 6. O agente dentro do app.** Conversa, na tela de um app, com o agente do Projeto no Hub.
- **Capacidade 7. Avisos e lembretes do CRM.** Recebe no CRM os avisos e lembretes de um dia de uso.

As respostas do fundador:

- **As capacidades, em 2026-11-09, ao estudo delas.** A Prévia usa os dados reais. Veem o banco do app o dono, o administrador e quem constrói (papéis do Better Auth). O Sync tem intervalo por dado, de 15 minutos no mínimo. Dono e administrador editam a identidade da empresa; o app a segue e troca a cor de destaque se pedem. O agente no app: "o agente dentro do app seria o agente dentro de um projeto, o app só meio que teria um visual, stream e uma ponte para o agente no HUB", com o modelo que o construtor de agentes escolher.
- **Aos pareceres do Builder, em 2026-11-09.** O Sync é da empresa, não de cada app: "da empresa faz mais sentido". O vínculo da pessoa é genérico: "a gente não pode focar no sankhya". Sugestões: "Isso é no app". O design, "igual o design.md, que o Impeccable utiliza". Capacidades uma por vez; sem banco de teste agora.

## O cartão de hoje

A Prévia em endereço próprio fechou em 2026-11-23: o fundador a usou na nuvem, na v0.24.111, e a
linha de fechamento está no [arquivo de aprovação](../../approvals/a-previa-em-endereco-proprio.md).
A Prévia mora em `<rótulo>--previa`, e o app publicado não abre dentro de outra página. O cartão está
no histórico do `main`, no commit `eb0d2ea1`, o último que o mudou.

A etapa 1 do harness, "Uma ficha por agente", entrou no `main` e no ar (v0.24.111 a v0.24.116): o
Builder, o Assistente, o Construtor e o agente publicado nascem cada um de uma ficha e de uma
montagem só, e o pedido de cada um ao modelo ficou igual, byte a byte. O desenho está na
[explicação do harness](../../explanation/harness.md), e o que a Plataforma mantém à mão, em
[boundaries](../../reference/boundaries.md). O cartão foi apagado com o fechamento; está no
histórico do `main`.

A etapa 2 do harness, "Uma sala e os nomes certos", fechou: o uso na nuvem foi em 2026-11-25, na
v0.24.130, e a linha de fechamento está no
[arquivo de aprovação](../../approvals/uma-sala-e-os-nomes-certos.md). As quatro conversas usam uma
sala só, e o desenho está na [explicação do harness](../../explanation/harness.md). O cartão está no
histórico do `main`, no commit `20c184c0`, o último que o mudou.

`A1`, "O Builder vê o que construiu", fechou em 2026-11-24: o fundador fez o roteiro na nuvem, na
v0.24.122, e a linha de fechamento está no
[arquivo de aprovação](../../approvals/o-builder-ve-o-que-construiu.md). O Builder sobe a versão num
Worker de conferência, abre a tela num navegador dentro da máquina e recebe o que viu; o desenho
está na [arquitetura](../../architecture.md). O cartão está no histórico do `main`, no commit
`936c7adc`, o último que o mudou.

Em 2026-11-28, o fundador decidiu que a parte agêntica inteira passa para o repositório
`conexus-harness`, construído sobre as peças nativas do Mastra, e que o código de agentes que o
Conexus tem hoje é apagado, não adaptado; o texto está no [roteiro](../../roadmap.md). Os cartões
antigos do harness que esperavam aprovação foram fechados como substituídos. A etapa 3,
"A rede e o navegador sob pedido", ficou congelada sem o fechamento, porque o código dela vai ser
apagado; o [arquivo de aprovação](../../approvals/rede-e-navegador-sob-pedido.md) guarda as palavras
dele. Antes fecharam Um escopo e a fábrica de ferramentas, em 2026-11-17
([aprovação](../../approvals/um-escopo-e-a-fabrica-de-ferramentas.md)), e a fundação do front-end,
em 2026-11-22 ([aprovação](../../approvals/fundacao-do-front-end.md)). A ordem dos marcos não muda.

O estudo de referência sobre como uma plataforma de referência cria apps terminou em 2026-11-16, fora
do repositório. O fundador respondeu duas coisas nele. Sobre a IA dentro do app: "Agora não; quando
um app pedir, forma A", com a nota "Isso já estpa dentro do escopo no futuro na nossa SDK é para
poder ter agentes dentro do app sim". Sobre a opção "não sei, me ajude a decidir" em cada pergunta do
Builder: "Sim, em todo cartão". As outras propostas do estudo são candidatas: cada uma entra pelo
cartão do marco da trilha que a pedir, com a aprovação dele.

## O que a trilha possui

- `apps/server/src/agents/` (menos `app-builder/runs/` e `app-builder/git/`) e, em
  `apps/server/src/harness/`, `spec/`, `turn/`, `memory/`, `prompt/`, `routes/` e `tools/`, como a
  regra `AGENTS_AND_APPS` do `dependency-cruiser` já diz (`.dependency-cruiser.cjs`).
- `packages/app/` e `packages/app-contract/`.
- As telas de conversa.

A trilha consome o contrato de acesso e não é dona dele. Toda pasta que nenhuma página de trilha
nomeia é da Plataforma, como `harness/mastra/`, `harness/model-accounts/` e `harness/machine/`. A Plataforma não é trilha: um defeito nela
entra na frente da fila de quem o achou (delivery L4).

## A interface: o contrato de acesso

Quando o arquivo do contrato vier, em outra tarefa, todo agente e todo app publicado chegarão ao dado da empresa só por ele, com três verbos:
descrever, ler e agir. A página da [trilha Dados](dados.md) traz o que cada verbo responde. Uma
regra do `dependency-cruiser` virá com o arquivo do contrato e proibirá esta trilha de importar de dados qualquer coisa que não seja o
contrato.

## Como pedir uma mudança no contrato

1. Abra uma issue com o rótulo `contrato`. Diga o que a pessoa veria, qual verbo muda e dê um
   exemplo.
2. A trilha Dados responde com um pull request pequeno que muda só o contrato e o teste de
   conformidade.
3. Depois que ele entra, o consumidor entra em outro pull request desta trilha.

## Os passos abertos da auditoria de arquitetura, nos marcos

A auditoria de 2026-11-14 deixou seis passos abertos. Cada um entra num marco desta trilha; os
passos 3 e 8 fecharam com a etapa 2 do harness.

- **Passo 3, fechado.** A sala única de conversa na web (`apps/web/src/harness/room/`) serve os quatro agentes: cada cartão desenhado pelo resultado de uma ferramenta sai de uma linha do registro por ferramenta, e cada agente diz o que é seu. O plano na conversa fica com o `conexus-harness`.
- **Passo 4.** As regras de prompt trocadas por mecanismo do Mastra ficam com o `conexus-harness`, que usa as peças nativas do Mastra.
- **Passo 5.** O modo de plano nativo do Mastra (`build` e `plan`) vem no `conexus-harness`.
- **Passo 6.** Do dono do conhecimento da empresa, o significado vai para `D4`, na trilha Dados. A memória do Projeto no Knowledge vai com o item 5 da lista do Brain, na página da [trilha Dados](dados.md), e o `conexus-harness` fica sem ela.
- **Passo 7.** As correções de stack andam ao lado de `A1`, cada uma num pull request. O convite com senha mexe em segurança e pede cartão.
- **Passo 8, fechado.** As pastas dizem o que cada uma é (`harness/` e `agents/<agente>/`, no servidor e na web). Na tela, quem responde nas conversas da plataforma é o Conexus, o agente da empresa responde com o próprio nome, e o menu do Projeto tem quatro grupos (O app, Agentes, Dados, O Projeto). Nenhum id guardado mudou, porque o id de cada agente e as marcas das conversas estão gravados nas conversas.
