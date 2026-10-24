# The card template

The card is the whole map of the step short of the code itself, within the ceiling of [delivery
L24](../../../../docs/guides/delivery.md). Its founder's page, in Portuguese, is the only part the
founder approves and fits one page. The rest serves the builder
and the reviewers and may be in Portuguese or English, one language per card.

The card never carries whole files. A unit's section is its build spec: what its builder reads,
with the start of the code where a step is not obvious. It drifted before when approved unread;
now the reader opens every cited line, the founder approves only his page, and the closing deletes
the card, after which the code is the only source.

```markdown
# Etapa <n>: <nome>

## A página do fundador

**No fim desta etapa** você <ação, pelo que uma pessoa vê>.

**O roteiro de uso.**

1. <ação e o que aparece>

**O que você faz, e quando.** Antes: <o que fornece>. No começo: aprova esta página. No fim: faz o
roteiro, diz o que viu e aprova os textos das telas.

**Fica de fora.** <o que não entra, e por quê>

**A decisão sua pedida nesta etapa.** <uma, com letras e um exemplo, ou "nenhuma">

## As unidades

| Unidade | O que entrega | Pastas | Guia além do de código | Depende de |
| --- | --- | --- | --- | --- |

<quais correm em paralelo, porque não dividem pasta>

**Orçamento de código alterado.** U<k>: <linhas, sem testes nem gerados>. Total da etapa: <linhas>.

## Os critérios de aceite

| # | Unidade | Critério, observável de fora, com a recusa | Teste que o prova | Nível |
| --- | --- | --- | --- | --- |
| 1 | U<k> | | <arquivo do teste e o caso> | <must / should> |

## A matriz de estados

| Tela | Primeira vez | Vazio | Carregando | Erro | Não encontrado | Sem permissão | Vencido ou recusado |
| --- | --- | --- | --- | --- | --- | --- | --- |

| Campo de contrato | Quem escreve | Quem lê |
| --- | --- | --- |

Uma etapa com tela leva também o desenho de caixas de cada tela, a 1280 e a 390 px, e as imagens
das capturas do produto antigo que o protótipo seguiu ([screens](screens.md)).

## A tabela de falhas

| Gravação ou comando, da etapa ou da biblioteca | Duas vezes ao mesmo tempo | Recusada no meio, depois de uma instrução ou de uma chamada | Uma dependência fora (o banco, ou um terceiro) | O que o processo imprime | Critérios |
| --- | --- | --- | --- | --- | --- |

## O mapa do estudo

| Achado ou decisão do estudo (relatório:linha) | Unidade dona, ou "fica de fora" e por quê |
| --- | --- |

## O que nasce novo e o que é trazido

| Mecanismo | Nativo, nosso ou trazido | Arquivo da árvore nova | Refatorado na entrada | Decisões antigas que carrega, com a base | Como Mastra, vibesdk e Conexus OS fazem, `file:line` |
| --- | --- | --- | --- | --- | --- |

**A medida do transplante.** <a medida da regra do estudo, por parte trazida (`conexus-study`, passo 5)>

**A dívida.** <consertos pequenos deixados, um por linha, que vão para a seção 11 da arquitetura>

## U<k> <nome>

**Base e modelo.** Commit base; o modelo do builder e por quê (Sonnet; Opus para desenho entre
módulos, concorrência ou algoritmo sutil).

### Ler primeiro

| Arquivo e símbolo | Linhas na base | Por quê |
| --- | --- | --- |

### A referência

| Pacote@versão ou repositório@commit, arquivo | Linhas | O que copiar e o que adaptar |
| --- | --- | --- |

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `<pasta da unidade>/` | Cria ou muda | |

### Os contratos que a unidade cria

Assinaturas em TypeScript, com o arquivo onde vivem (hub-api, server, web), e o que se apaga:
rotas (método, caminho, acesso, entrada, saídas e falhas), colunas de tabela com
tipo e restrição, tipos exportados por nome e campos, códigos de falha. Nenhum corpo de função.

Além delas, a forma de cada coisa (a conclusão da seção 5 do estudo desce para cá, porque quem
constrói não lê o estudo):

- **Cada estado** como união, com o campo que separa as variantes (C21, C22).
- **Cada id** com a sua marca e o lugar onde é conferido (C23).
- **O dono de cada fato compartilhado**: lista, código, frase, constante (C26).
- **O esquema Zod de cada entrada externa** (C27).
- **O arquivo tomado como modelo**, dizendo se ele cumpre C21, C23 e C26; se não cumpre, não é
  modelo.

### As skills e a leitura

<as linhas de `docs/reference/stack.md` das pastas da unidade: cada skill, e o que ler primeiro>

### A ordem do trabalho

1. <arquivo, símbolo, a mudança>. Regras: <ids>. Funções: <pacote@versão: função; opções e
   padrão>. Para um passo não óbvio, o começo do código.

### Como se prova

<para cada critério da unidade: o teste, a gravação que ele toca (T26), o comando, a recusa que ele
mostra, e o teste que falha hoje>

### Parar se

<o que o builder não decide: cada ponto que só o teste revela, e o que fazer>
```

## What makes a card good

- Someone who did not write the code can check every criterion from outside, and each says what is
  refused as well as what works.
- Every folder the build will touch is in a unit's blast radius, with its importers, and so is the
  owner of each contract the unit creates (the failure table, the config, its test door). A file
  outside them stops the build only as [delivery L7](../../../../docs/guides/delivery.md) says. A
  unit that adds a package lists the shared root files it changes (`package.json`,
  `package-lock.json`, `biome.json`, `ci.yml`). No unit builds a check for the step: it lands first,
  in a pull request of its own ([delivery L20](../../../../docs/guides/delivery.md)).
- A contract is a signature a reviewer can compare with the diff, not a design to re-derive.
- A criterion about a provider's behaviour cites the installed provider's code.
- The table of parts has one row per mechanism, never "o resto". The reference cell says "nenhuma
  faz" when none does. A "nosso" row names the native candidate at the installed version and the
  proof that it does not serve (a script's output or a test), and links its
  [boundaries](../../../../docs/reference/boundaries.md) entry; a row without the proof goes back to
  the study. "Embrulhado" says in one line what the wrapper adds.
- Each unit lists what it deletes from `main` before what it adds. A fact used by two units has one
  owner unit and one criterion whose test crosses both.
- The order of the work names guide rules by identifier and never restates them.
- Every write or command the step adds, its own or a library's, has its row in the failure table,
  and each cell names its criterion; a step with no write writes "nenhuma". Founder, 2026-10-15:
  "A-A".
- The card takes every item of the open issues labelled `next-card`, or says on the founder's page
  why one waits. Whoever files an item for the next card applies the label; the closing removes the
  items the step took ([delivery L19](../../../../docs/guides/delivery.md)).

## The reader's questions

The reader of step <n> answers each one with the card's line.

1. For each thing a criterion or contract observes (a status, a failure code, a bound, the console,
   a cookie), open the guide that owns it: does the card hold against its rules, cited or not, and
   cite them by identifier without restating them?
2. Does each named test reach what it tests through the public door ([testing
   T5](../../../../docs/guides/testing.md))?
3. Does any criterion rest on a fact the study lists as not proved?
4. Does every write the study listed have its row in the failure table?
5. Is each guide rule the study found resting only on "implemented so" a decision on the founder's
   page?
6. Does the state matrix give every screen its states, and every contract field a writer and a
   reader? A field nobody reads leaves the contract.
7. Does each unit's section of contracts give every state its union, every id its brand, every
   shared fact its owner, every outside input its schema, and the model file its verdict on C21,
   C23 and C26?
8. Does every cited reference line, opened at the installed version, say what the section claims?
9. Does the study's map give every finding an owner unit or a reason to stay out?
