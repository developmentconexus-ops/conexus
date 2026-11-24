# A folha de movimento

Estado: **aprovado em 2026-11-17**: menu e popover abrem na hora, largura e altura não animam, e a folha inteira. Entra no `DESIGN.md` e no guia de design no pull request à parte.

Este documento é parte da camada de produto. É uma folha, não uma fase. Os donos de hoje
continuam: os valores ficam no `DESIGN.md` (Elevation & Depth, "Motion") e a regra no guia de design
(V26). Aprovada, a folha entra nesses dois lugares no pull request à parte; este arquivo não vira um terceiro
dono. Nenhuma duração nova: os nomes são novos, os valores são os da Pauta.

## 1. A tese

O Hub é uma superfície de trabalho. O movimento serve a três coisas, e só a elas:

1. **Confirmar** que um clique pegou (a chave que vira, a caixa que marca).
2. **Explicar de onde veio** o que entrou na tela (a gaveta que sobe de baixo, o painel que entra do
   lado).
3. **Mostrar que há trabalho rodando** no servidor (a marca Encaixe, o arco do compositor, o brilho da
   linha de trabalho).

O único movimento com autoria é o terceiro, e ele já existe: as peças da marca que se separam e se
encaixam enquanto o agente trabalha. Não se cria um segundo.

As guias dos grandes sistemas de design dizem o mesmo de um produto de trabalho: não pôr movimento nas
interações frequentes, reservar o movimento expressivo para momentos ocasionais e importantes, e tratar
o movimento como uma camada que esclarece, não como enfeite.

## 2. O que existe hoje

Em `apps/web/src`, fora dos testes.

| O quê | Hoje | Onde |
| --- | --- | --- |
| Arquivos com alguma classe de movimento | 19 | `ui/` (13), `builder/conversation/` (3), `brand/mark.tsx`, `harness/model-accounts/sign-in-form.tsx`, `hub/copies/data-tree.tsx` |
| Durações usadas | 150 ms, 200 ms, 300 ms (uma vez), 0 | `ui/dialog.tsx`, `ui/sheet.tsx`, `ui/drawer.tsx`, `ui/sidebar.tsx`, `harness/room/memory-status.tsx` |
| Curvas nas peças | três diferentes: `ease-out` (gaveta), `ease-in-out` (painel), `ease-linear` (largura da barra); o resto usa a curva padrão do navegador | `ui/drawer.tsx`, `ui/sheet.tsx`, `ui/sidebar.tsx` |
| Curvas como token | duas, só para o trabalho em andamento: `--ease-fit` e `--ease-arrive` | `apps/web/src/brand/tokens.css` |
| Menu, popover, seletor, dica, abas, botão | nenhuma transição: abrem e mudam de cor na hora | `ui/popover.tsx`, `ui/dropdown-menu.tsx`, `ui/select.tsx`, `ui/tooltip.tsx`, `ui/tabs.tsx`, `ui/button.tsx` |
| Painel que dobra (linha de ferramenta, raciocínio) | nenhuma transição | `ui/collapsible.tsx` |
| Biblioteca de animação | nenhuma; só CSS | `apps/web/package.json` |
| Movimento reduzido | cada peça desliga a sua transição; os laços de trabalho só rodam sem a preferência | `motion-reduce:` e `motion-safe:` nas peças; `apps/web/src/brand/tokens.css` |

Dois desencontros entre o `DESIGN.md` e o código:

- O `DESIGN.md` diz "collapsible panels 200ms of height". O código não anima o painel que dobra.
- O `DESIGN.md` diz que a largura da barra lateral anima em 200 ms, e o código anima. Pede-se
  para não animar largura e altura, como as guias de movimento dos grandes sistemas de design.

## 3. Os tokens

Nenhum valor novo. Os números são os da Pauta, e as curvas são as duas que já existem em
`brand/tokens.css`. O que muda é que as peças passam a usar um nome em vez de cada uma a sua curva.

| Token | Valor | Para quê |
| --- | --- | --- |
| `duration-feedback` | 150 ms | cor, opacidade, a chave que vira, o véu de uma janela |
| `duration-move` | 200 ms | o que entra ou sai de lugar: gaveta, painel lateral |
| `ease-enter` | o valor de `--ease-arrive`, `cubic-bezier(0.22, 1, 0.36, 1)` | o que entra: desacelera ao chegar |
| `ease-exit` | `ease-in` | o que sai: acelera ao sair, e dura 150 ms |
| `ease-fit` | já existe, `cubic-bezier(0.65, 0, 0.35, 1)` | o que se move sem entrar nem sair: a bolinha da chave, a marca |

Os números ficam dentro do que as guias dos grandes sistemas de design convergem: 70 a 150 ms para
interação pequena, 150 a 250 ms para transição média. Sair mais rápido que entrar é regra comum a elas.

## 4. A regra por padrão

| Padrão | Anima? | Como |
| --- | --- | --- |
| Passar o mouse, apertar, foco | **não** | na hora. É o que mais se repete, e o foco nunca espera |
| Chave, caixa de marcar | sim | cor e bolinha, `duration-feedback`, `ease-fit` |
| Menu, popover, seletor, dica | **não** | abrem e fecham na hora, como hoje |
| Janela (diálogo, confirmação) | sim | só opacidade do véu e da janela, `duration-feedback` |
| Gaveta de baixo (celular), painel lateral | sim | entra em `duration-move` com `ease-enter`; sai em `duration-feedback` com `ease-exit` |
| Barra lateral que recolhe, e a coluna do lugar (P19) | **não** | troca de largura na hora (hoje anima a largura). O botão de recolher que o mapa 5.3 decidiu muda o ícone na hora |
| Painel que dobra (linha de ferramenta, raciocínio, grupo) | **não** | abre na hora (como o código já faz) |
| Esqueleto de carregamento | sim | o pulso de hoje |
| Trabalho em andamento | sim | a marca Encaixe, o arco do compositor, o brilho; só enquanto o servidor diz que roda (princípio E4) |
| Mensagem nova na conversa, texto que chega | **não** | o texto aparece; nada desliza. A rolagem até o fim é suave |
| Linha que entra ou sai de uma lista ou tabela | **não** | aparece e some na hora |
| Troca de página, de aba, de seção | **não** | sem transição de página |
| Erro, aviso, validação | **nunca** | o que a pessoa precisa ler não espera uma entrada |
| Número que muda | **nunca** | o número troca; não conta nem rola |
| As peças de IA da fundação (linha de ferramenta, rastro, anexo, painel de tarefas) e a tabela | **não** | seguem as linhas do painel que dobra, da mensagem nova e da linha de tabela acima; só a rolagem até o fim da conversa é suave |
| Página que fica pronta no painel da primeira entrada (alvo de JB5) | **não** | a palavra e o ponto mudam quando o servidor salva (E5); nada acende em sequência |

## 5. O que nunca anima

- Largura, altura, margem ou posição de leiaute. Só opacidade e deslocamento por `transform`.
- Erro, foco e validação.
- A carga da página: nada entra em sequência quando a tela abre.
- Um laço que não é trabalho em andamento.

## 6. Movimento reduzido

Continua a regra de design V26: com a preferência do sistema, toda transição é nenhuma e todo laço para, com o
estado final legível. O que confirma uma ação continua visível sem movimento: a chave muda de cor, a
janela aparece.

## 7. O que muda no código, quando um cartão pedir

Nada aqui é construído agora. Para o cartão que levar esta folha:

- `brand/tokens.css` ganha os dois nomes de duração e os dois de curva.
- `ui/drawer.tsx`, `ui/sheet.tsx` e `ui/sidebar.tsx` trocam as três curvas soltas pelos nomes.
- `ui/sidebar.tsx` deixa de animar a largura.
- `DESIGN.md` perde "collapsible panels 200ms of height" e "the sidebar width 200ms", e ganha a tabela
  da seção 4.
