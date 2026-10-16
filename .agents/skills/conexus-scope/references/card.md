# The card template

The card is the whole map of the step short of the code itself, within the ceiling of [delivery
L24](../../../../docs/guides/delivery.md). Its founder's page, in Portuguese, is the only part the
founder approves and fits one page. The rest serves the builder
and the reviewers and may be in Portuguese or English, one language per card.

The card never carries the implementation: no function bodies and no full code, only names and
signatures. Specifications that carried the code drifted from it and were approved without being
read.

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

| Unidade | O que entrega | Pastas | Guia além do de código | Skills dos mantenedores | Depende de |
| --- | --- | --- | --- | --- | --- |

<quais correm em paralelo, porque não dividem pasta>

## Os critérios de aceite

| # | Unidade | Critério, observável de fora, com a recusa | Teste que o prova | Nível |
| --- | --- | --- | --- | --- |
| 1 | U<k> | | <arquivo do teste e o caso> | <must / should> |

## A matriz de estados

| Tela | Vazio | Carregando | Erro | Não encontrado | Vencido ou recusado |
| --- | --- | --- | --- | --- | --- |

| Campo de contrato | Quem escreve | Quem lê |
| --- | --- | --- |

## A tabela de falhas

| Gravação ou comando, da etapa ou da biblioteca | Duas vezes ao mesmo tempo | Recusada no meio, depois de uma instrução ou de uma chamada | Uma dependência fora (o banco, ou um terceiro) | O que o processo imprime | Critérios |
| --- | --- | --- | --- | --- | --- |

## O que nasce novo e o que é trazido

| Parte | Nova ou trazida | Arquivo da árvore nova | Refatorado na entrada | Decisões antigas que carrega, com a base |
| --- | --- | --- | --- | --- |

**A medida do transplante.** <a medida da regra do estudo, por parte trazida (`conexus-study`, passo 5)>

**A dívida.** <consertos pequenos deixados, um por linha, que vão para a seção 11 da arquitetura>

## U<k> <nome>

### O raio da mudança

| Pasta, ou dono de um contrato | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |
| `<pasta da unidade>/` | Cria ou muda | |

### Os contratos que a unidade cria

Só assinaturas: rotas (método, caminho, acesso, entrada, saídas e falhas), colunas de tabela com
tipo e restrição, tipos exportados por nome e campos, códigos de falha. Nenhum corpo de função.

### A ordem do trabalho

1. <passo>. Regras: <ids, por exemplo C27, D21>. Funções: <pacote@versão: função; as opções de que a
   garantia depende, com o padrão>.

### Como se prova

<para cada critério da unidade: o teste, o comando que o roda, e a recusa que ele mostra>
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
- The order of the work names guide rules by identifier and never restates them.
- Every write or command the step adds, its own or a library's, has its row in the failure table,
  and each cell names its criterion; a step with no write writes "nenhuma". Founder, 2026-10-15:
  "A-A".
- The card takes every item of the open issues labelled `next-card`, or says on the founder's page
  why one waits. Whoever files an item for the next card applies the label; the closing removes the
  items the step took ([delivery L19](../../../../docs/guides/delivery.md)).

## The reader's questions

The reader of step 9 answers each one with the card's line.

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
