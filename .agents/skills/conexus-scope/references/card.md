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
roteiro e diz o que viu.

**Fica de fora.** <o que não entra, e por quê>

**A decisão sua pedida nesta etapa.** <uma, com letras e um exemplo, ou "nenhuma">

## As unidades

| Unidade | O que entrega | Pastas | Guia além do de código | Depende de |
| --- | --- | --- | --- | --- |

<quais correm em paralelo, porque não dividem pasta>

## Os critérios de aceite

| # | Unidade | Critério, observável de fora, com a recusa | Teste que o prova | Nível |
| --- | --- | --- | --- | --- |
| 1 | U<k> | | <arquivo do teste e o caso> | <must / should> |

## O que nasce novo e o que é trazido

| Parte | Nova ou trazida | Arquivo da árvore nova | Refatorado na entrada | Decisões antigas que carrega, com a base |
| --- | --- | --- | --- | --- |

**A medida do transplante.** <a medida da regra do estudo, por parte trazida (`conexus-study`, passo 5)>

**A dívida.** <consertos pequenos deixados, um por linha, que vão para a seção 11 da arquitetura>

## U<k> <nome>

### O raio da mudança

| Arquivo | Cria, muda ou apaga | Quem importa ou chama |
| --- | --- | --- |

### Os contratos que a unidade cria

Só assinaturas: rotas (método, caminho, acesso, entrada, saídas e falhas), colunas de tabela com
tipo e restrição, tipos exportados por nome e campos, códigos de falha. Nenhum corpo de função.

### A ordem do trabalho

1. <passo>. Regras: <ids, por exemplo C27, D21>. Funções: <pacote@versão: função>.

### Como se prova

<para cada critério da unidade: o teste, o comando que o roda, e a recusa que ele mostra>
```

## What makes a card good

- Someone who did not write the code can check every criterion from outside, and each says what is
  refused as well as what works.
- Every file the build will touch is in a unit's blast radius, with its importers. A file outside it
  stops the build ([delivery L7](../../../../docs/guides/delivery.md)).
- A contract is a signature a reviewer can compare with the diff, not a design to re-derive.
- The order of the work names guide rules by identifier and never restates them.
