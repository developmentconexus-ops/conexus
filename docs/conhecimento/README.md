# Conhecimento: o que foi decidido, provado e lido, por assunto

Os estudos do Conexus ficam fora deste repositório, em `conexus-estudos` ([delivery L21](../guides/delivery.md)). Por isso,
uma pesquisa já feita some da vista de quem chega depois, e o próximo estudo a refaz. Esta pasta guarda, por
assunto, só a conclusão de cada estudo: o registro em que a decisão virou, a prova com o seu número, a
referência lida com a versão e o nome da pasta do estudo de origem. O relatório, as provas e as
capturas continuam fora do repositório. Aqui fica a frase que diz se vale abrir o relatório.

## Como consultar

1. Antes de pesquisar, abra o assunto na tabela abaixo e leia as seções Decidido, Provado, Lido,
   Superado e Aberto.
2. Pesquise só o que falta. Diga no relatório o que reaproveitou e de qual estudo.
3. Um estudo marcado como superado não sustenta uma decisão. Siga o que o superou.
4. Ao fechar um estudo, acrescente a linha dele no assunto: a data, o nome da pasta, o estado, o
   registro em que virou e uma frase com o que decidiu, provou ou leu.

Cada página de assunto tem estas seções:

- **Decidido**: os registros de [decisions/](../decisions/) e as aprovações do assunto, com o estado
  de cada um. O texto do registro manda; aqui fica uma linha por registro.
- **Provado**: o que rodou de verdade, com o número medido e o estudo que mediu.
- **Lido**: a referência, na versão em que foi lida, e o que se tirou dela.
- **Superado**: o que se dizia antes e o que o substituiu.
- **Aberto**: as perguntas sem decisão, com quem decide.
- **Estudos de origem**: uma linha por estudo, da data mais nova para a mais velha. Revisões, QA,
  deltas e construções ficam de fora, porque só provam que uma etapa foi feita (delivery L21).

## Os assuntos

| Assunto | O que cobre | Onde ficam as regras e o desenho |
| --- | --- | --- |
| [Conectores](conectores.md) | O kit, o ao vivo, o Sankhya, o Mercado Livre e o HubSpot, a escolha de tabelas e os nomes no lago | [add-a-connector](../how-to/add-a-connector.md), [sync](../explanation/sync.md) |
| [Lago e AWS](lago-e-aws.md) | Onde o dado copiado mora, a pilha por empresa, Athena, Lake Formation, Fargate, a comparação com a Nekt e o Databricks | [Trilha Dados](../steps/trilhas/dados.md), [laboratório](../how-to/aws-conta-de-laboratorio.md) |
| [Extração Singer](extracao-singer.md) | Taps, targets, Meltano, o adaptador do kit, o dinheiro exato e a primeira cópia | [Trilha Dados](../steps/trilhas/dados.md) |
| [Credenciais](credenciais.md) | O login de cada sistema, o selo, a renovação e como a credencial chega à cópia | [security](../guides/security.md), [seal keys](../how-to/seal-keys.md) |
| [Catálogo e Ontologia](catalogo-e-ontologia.md) | O catálogo, a descoberta, a Ontologia, o Brain e o Knowledge | [data](../guides/data.md) |
| [Agentes e harness](agentes-e-harness.md) | O Assistente, os agentes do Projeto, a ficha, as ferramentas, a escrita, os gatilhos, o rastreio e as evals | [harness](../explanation/harness.md), [agentes](../explanation/agents-and-automations.md) |
| [Builder](builder.md) | Como o Builder constrói, a máquina, o navegador e a conferência do fim do turno | [turno](../explanation/builder-turn.md), [prompt](../reference/builder-prompt.md) |
| [Prévia e apps](previa-e-apps.md) | A Prévia, o app publicado, o cookie e o endereço | [app](../explanation/app-package.md), [contrato](../explanation/app-contract-and-dispatcher.md) |
| [Desenho e movimento](desenho-e-movimento.md) | A direção visual do Hub, os tokens, o movimento das peças e a trilha Redesenho | [design](../guides/design.md), [movimento](../reference/movimento.md) |
| [Autenticação e papéis](autenticacao-e-papeis.md) | O login do Hub, os papéis, quem lê o quê, o Registro e os dados pessoais | [security](../guides/security.md) |
| [Operação e servidor](operacao-e-servidor.md) | O servidor, a publicação, o CI e o acesso sem SSH | [hub-server](../how-to/hub-server.md), [ci-health](../how-to/ci-health.md) |

Três assuntos não ganham página porque já têm dono. A direção do produto está na
[VISION.md](../../VISION.md). As telas e a Pauta estão no [DESIGN.md](../../DESIGN.md) e no guia
[design](../guides/design.md). O método de trabalho está no guia [delivery](../guides/delivery.md)
e nas [aprovações do método](../approvals/metodo.md).

## Páginas publicadas

As páginas que o fundador já viu entram por link. Cada uma descreve o assunto na data em que foi
publicada; um registro posterior manda sobre ela.

| Página | Assunto | Data |
| --- | --- | --- |
| [Visão do Conexus](https://claude.ai/artifact/KHj6XhRNbPoVtRvrdic7um) e [Hipóteses da visão](https://claude.ai/artifact/BUriPCeCjmNXirZJTSPxho) | a visão | 2026-11-23 |
| [Lago 2 reestudado](https://claude.ai/artifact/WxcTZKwnVmde3xeeR39zS2) e [Decisões do Lago 2](https://claude.ai/artifact/8BmoqomUhP9mMTrGtfk6Du) | Extração Singer | 2026-11-23 |
| [Mapa auth do Conexus](https://claude.ai/artifact/9VHqeE9GViDK4FY1Pagywz) | Autenticação e papéis | 2026-11-22 |
| [Arquitetura de Dados Conexus](https://claude.ai/artifact/AQg1yUSpcCzQebBbBibRC1) e [Revisão do B0](https://claude.ai/artifact/M1iejq2YjJJnNMXch53eRb) | Lago e AWS | 2026-11-21 |
| [Registro e Avisos do Membro](https://claude.ai/artifact/QVhfonckMfWk51BTooJ9gX) e [Revisão da emenda do Registro](https://claude.ai/artifact/YDrkZ3mTnaAtdVqpW6fZ4R) | Autenticação e papéis | 2026-11-21 |
| [Mapa da Execução Conexus](https://claude.ai/artifact/DZUjWW3aDAgsmW4hDVjqe9) | todos, o plano | 2026-11-17 |
| [A base de dados do Conexus](https://claude.ai/artifact/3ASSiudaTnBLmd66UhiWTE) e [A base alvo do Conexus](https://claude.ai/artifact/F4M9gX57eQXv1wQPDfU73T) | Lago e AWS, antes da [0070](../decisions/0070-copied-company-data-lives-in-a-lake-on-aws.md) | 2026-11-17 |
| [Dados e Registro](https://claude.ai/artifact/68PxVKXdHZn5NnWkbAWCgU) e [Reanálise do Registro](https://claude.ai/artifact/MfD8T6zMVPAbmd6RqPEhLW) | Autenticação e papéis | 2026-11-17 |

## Como os estudos são citados

Um estudo é citado pelo nome da pasta, como `conexus-extracao-singer`. A pasta fica fora deste
repositório, no repositório privado `conexus-estudos`, em `estudos/<pasta>/`, com o `report.md`, as
provas e as capturas. O nome nunca muda. Um estudo sem relatório
na pasta aparece como em curso, ou como pedido sem resultado.
