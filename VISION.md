# A visão do Conexus

O que o Conexus é, o que não é e o que cada parte recusa. Um estudo, um cartão ou um pull request
se mede por ela: alinha, ou deve ser recusado. Só o produto: ritmo, ordem e escolhas de agora são
do [roteiro](docs/roadmap.md) (fundador, 2026-11-23: "visao e sobre o produto"). Cada linha traz a
origem; "conceito" é o [conceito](docs/explanation/conceito.md) que o fundador aprovou em
2026-11-17. As metas de qualidade são da [arquitetura](docs/architecture.md); as regras, dos
[guias](docs/guides/). O produto é do fundador (delivery L6): só uma palavra dele muda esta página.

## O Conexus

> O Conexus junta os dados, os sistemas e o conhecimento de como a empresa opera numa camada de
> contexto e ontologia que aprende com o uso. Sobre ela a empresa analisa, automatiza, põe a
> inteligência artificial para trabalhar e cria os apps que os seus processos pedem.

(conceito, seção 1)

- Serve empresas e indústrias com vários dados, conectores e sistemas desconexos, com quem programa
  e quem não programa: "não é um delimitador" (fundador, 2026-11-17).
- A língua não delimita o produto: "NÃO FOCARIA no português" (fundador, 2026-11-17).
- São três Solutions sobre a Plataforma: Conexus Data & Context, Conexus Agents e Conexus Apps. Na
  tela, Dados e contexto, Agentes e Apps (fundador, 2026-11-23: "M1 okay", "M4 okay").
- Nunca inventa um valor nem simula progresso: um número mostrado como vindo de um sistema veio de
  uma leitura real, e o que não se sabe aparece como indisponível, nunca como zero (conceito,
  seção 5).
- Nunca deixa o modelo declarar o trabalho pronto: o Conexus é dono do estado da execução (idem).
- Nunca sobrescreve o trabalho mais novo de outra pessoa, nunca mostra uma credencial e nunca
  publica sozinho (idem).
- Não substitui o ERP: o dado oficial continua nos sistemas da empresa (idem).
- Não é console de banco nem ferramenta de arrastar e soltar: cria-se conversando, e o resultado é
  código de verdade (conceito, seção 6).

**Alinha quando** a mudança serve a uma empresa de sistemas desconexos e cabe numa das três
Solutions ou na Plataforma.

**Deve ser recusada quando** faz o que uma linha "Nunca" ou "Não" acima recusa, faz de uma língua
ou de saber programar uma condição de uso, ou cria uma quarta Solution.

## Conexus Data & Context

A base: leva os sistemas da empresa "para uma camada de ontologia e conhecimento para centralizar
não somente dados, mais o conhecimento de como a empresa opera" (fundador, 2026-11-17).

- Vende-se sozinha: uma empresa pode ter só Data & Context (fundador, 2026-11-23: "M1 okay").
- É dona do contrato de acesso: agentes e apps chegam ao dado só por ele, com três verbos,
  descrever, ler e agir (fundador, 2026-11-14, ao parecer do conselheiro: "Aceito todos";
  [trilha Dados](docs/steps/trilhas/dados.md)).
- O contrato decide de onde se lê e em que dialeto, pelo catálogo, nunca por uma frase de prompt
  ([0079](docs/decisions/0079-the-agent-reads-the-lake-neon-serves-apps.md)).
- Catálogo primeiro, Ontologia por cima, e a Ontologia é a única fonte de significado (fundador,
  2026-11-14: "2A"; [0064](docs/decisions/0064-company-ontology-in-hub-tables-by-approved-proposals.md)).
- Nada conta antes de uma pessoa aprovar: o que se propõe é proposta, não fato (0064, `B1`,
  fundador, 2026-11-12).
- Uma fonte só de conectores, o kit; a Nango fica fora do código
  ([0069](docs/decisions/0069-connectors-one-source-the-kit.md); fundador, 2026-11-23: "Q4
  recomendado").
- O conector e a ferramenta ao vivo do kit, como o Gmail, são de Data & Context (fundador,
  2026-11-23: "M1 okay").
- Não é um sistema só: "o Connexus não é só o Sankhya é um conector de exemplo" (fundador,
  2026-11-21), e cada capacidade vale para toda classe de conector (2026-11-21: "G1 b").
- O dado copiado mora no lago de cada empresa, e o lago é a fonte dele: "nossa fonte e o lago",
  sem caminho paralelo pelo banco da empresa (fundador, 2026-11-23;
  [0070](docs/decisions/0070-copied-company-data-lives-in-a-lake-on-aws.md)). O banco da empresa
  recebe do lago só as tabelas que um app declara (0079).

**Alinha quando** a mudança traz um sistema pelo kit, leva o dado copiado ao lago, serve o dado pelo
contrato ou dá a ele um significado aprovado na Ontologia.

**Deve ser recusada quando** abre uma segunda fonte de conectores, deixa um agente ou um app chegar
ao dado por fora do contrato, escolhe a fonte por uma frase de prompt, dá significado fora da
Ontologia, conta como fato o que ninguém aprovou, desenha uma capacidade para um sistema só, ou
guarda dado copiado por um caminho que não sai do lago.

## Conexus Agents

Põe a inteligência artificial para trabalhar sobre a base da empresa: perguntar, analisar,
automatizar e escrever no sistema (conceito, seção 3.2, de onde vêm as linhas sem outra origem).

- São de Agents o Assistente, o Construtor, os agentes salvos, as automações e a biblioteca de
  ferramentas do Projeto (fundador, 2026-11-23: "M1 okay", "M2 nao").
- Todo agente chega ao dado só pelo contrato de acesso e, quando alguém pergunta, lê com o papel
  de quem pergunta (conceito, seção 4, `E6`).
- A resposta diz de qual sistema veio e de quando é.
- Escrever no sistema pede a aprovação de uma pessoa, ou corre sozinho quando a empresa decidir.
- Todo agente segue o mesmo conhecimento da empresa.

**Alinha quando** a mudança deixa um agente perguntar, analisar, automatizar ou escrever sobre a
base da empresa, com a fonte e a hora à vista.

**Deve ser recusada quando** faz um agente ler por fora do contrato ou além do papel de quem
pergunta, responder sem dizer de qual sistema e de quando, escrever sem a aprovação onde a empresa a
pede, ou seguir um conhecimento da empresa que os outros agentes não seguem.

## Conexus Apps

Os processos da empresa viram tela: o app é da empresa, para a empresa, e dá a "liberdade criativa
o que muitos ERPs e serviços utilizados travam" (fundador, 2026-11-09). As linhas sem outra origem
são do conceito, seção 3.3.

- Não cria app para ser vendido e acessado pelo público: "A gente não é o lovable, dyad, base44"
  (fundador, 2026-11-09).
- Não se vende sem Agents: o Builder é um agente, e o agente dentro do app é o do Projeto no Hub,
  "o app só meio que teria um visual, stream e uma ponte para o agente no HUB" (fundador,
  2026-11-23: "M2 nao"; 2026-11-09).
- Pede-se o app conversando, vê-se a prévia e publica-se.
- O plano se aprova antes de qualquer código, e cada pedido aparece conferido no fim.
- O app entregue funciona: o Builder vê o que construiu e conserta sozinho.
- O app tem a cara da empresa (também fundador, 2026-11-14: "3B").
- O app lê o dado e os conceitos pelo mesmo contrato dos agentes, dentro do isolamento da
  arquitetura.
- Quem usa cada app se decide por papel, e o app volta a uma versão anterior.

**Alinha quando** a mudança faz um processo da empresa virar um app que funciona, com a cara dela,
sobre o dado dela.

**Deve ser recusada quando** cria app para o público, vende Apps sem Agents, põe no app um agente
que não é o do Projeto no Hub, escreve código antes do plano aprovado, declara o app pronto sem
conferir, ou faz um app chegar ao dado por fora do contrato.

## A Plataforma

O núcleo de toda Solution: a identidade da empresa, as pessoas e os papéis, os Projetos, a
publicação e a borda ([trilha Dados](docs/steps/trilhas/dados.md), "O que a trilha possui").

- Vem inclusa e não se vende sozinha (fundador, 2026-11-23: "M1 okay").
- É uma plataforma só: cada empresa liga as suas Solutions, e o uso se mede por Solution (fundador,
  2026-11-23: "M5 okay").

**Alinha quando** a mudança serve às três Solutions pelo mesmo núcleo.

**Deve ser recusada quando** vende a Plataforma sozinha, mede o uso de uma Solution por fora da
Plataforma, ou parte uma Solution num produto à parte.
