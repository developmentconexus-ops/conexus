# A folha de movimento

Estado: **aprovado em 2026-11-17, revisto em 2026-11-26** para o redesenho: a escala curta medida no
G4 OS ("2. Recomendado") e as duas molas ("A A-b"). Largura e altura continuam sem animar; menu,
popover, dica, hover, toque e troca de tela passam a animar, em tempo curto.

Este documento é parte da camada de produto. É uma folha, não uma fase. A regra fica no guia de design
(V26) e os valores vão para o `DESIGN.md` ("Motion") e para o `tokens.css` pela etapa R1 do redesenho;
até lá, valem os desta folha. Este arquivo não vira um terceiro dono.

## 1. A tese

O Hub é uma superfície de trabalho. O movimento serve a três coisas, e só a elas:

1. **Confirmar** que a pessoa alcançou e acionou uma peça (a cor que muda sob o mouse, o botão que
   cede, a chave que vira, a caixa que marca).
2. **Explicar de onde veio** o que entrou na tela (o menu que abre do seu botão, a gaveta que sobe de
   baixo, o painel que entra do lado, a folha que esmaece ao trocar de área).
3. **Mostrar que há trabalho rodando** no servidor (a marca Encaixe, o arco do compositor, o brilho da
   linha de trabalho).

O único movimento com autoria é o terceiro, e ele já existe: as peças da marca que se separam e se
encaixam enquanto o agente trabalha. Não se cria um segundo.

O que se repete muito anima pouco: só a cor no mouse, e nada acima de 200 ms na navegação. As duas
molas, mais longas, ficam no que a pessoa aperta ou muda de estado. As escalas lidas no estudo
(Atlassian, IBM Carbon, Material 3) animam hover e menu em até 200 ms, e o G4 OS foi medido ao
vivo. Movimento é uma camada que esclarece, não enfeite.

## 2. O que existe hoje

Em `apps/web/src`, fora dos testes.

| O quê | Hoje | Onde |
| --- | --- | --- |
| Arquivos com alguma classe de movimento | 18 | `ui/` (13), `agents/app-builder/` (3), `brand/mark.tsx`, `harness/model-accounts/sign-in-form.tsx` |
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

| Token | Valor | Para quê |
| --- | --- | --- |
| `duration-row` | 75 ms | a cor da linha da barra, do menu e da paleta; a saída do menu e da dica |
| `duration-control` | 160 ms | a cor e a sombra do botão, da aba, da linha de tabela, do campo e do cartão |
| `duration-press` | 420 ms | o toque: o botão cede até 96% e volta, na mola `ease-spring-press` |
| `duration-state` | 560 ms | a chave e a caixa mudando de estado, na mola `ease-spring-state` |
| `duration-menu` | 120 ms | menu, popover, seletor, combobox e dica entrando |
| `duration-window` | 150 ms | janela e véu; a saída da gaveta, do painel e do aviso |
| `duration-move` | 200 ms | a entrada da gaveta, do painel lateral e do aviso |
| `duration-page` | 160 ms | a troca de tela |
| `ease-enter` | `cubic-bezier(0.22, 1, 0.36, 1)` | o que entra: desacelera ao chegar |
| `ease-exit` | `ease-in` | o que sai: acelera ao sair |
| `ease-fit` | `cubic-bezier(0.65, 0, 0.35, 1)` | o que se move sem entrar nem sair: a marca |
| `ease-spring-press` | curva `linear()` de mola | o toque |
| `ease-spring-state` | curva `linear()` de mola, mais calma | a mudança de estado |

As duas molas são curvas `linear()` em CSS, sem biblioteca de animação; os números delas ficam no
`tokens.css`.

## 4. A regra por padrão

| Padrão | Anima? | Como |
| --- | --- | --- |
| Passar o mouse | sim | só cor e sombra: `duration-row` nas linhas da barra, do menu e da paleta; `duration-control` nas outras peças |
| Apertar | sim | cede até 96% e volta, `duration-press`, `ease-spring-press` |
| Foco | **não** | o aro aparece na hora; o foco nunca espera |
| Chave, caixa de marcar | sim | cor e bolinha, `duration-state`, `ease-spring-state` |
| Menu, popover, seletor, combobox | sim | opacidade e escala de 96% a 100% a partir do botão, `duration-menu`; sai mais rápido, `duration-row` |
| Dica | sim | como o menu; ao passar de uma dica para outra, a segunda abre sem transição |
| Janela (diálogo, confirmação) | sim | só opacidade do véu e da janela, `duration-window` |
| Gaveta de baixo (celular), painel lateral | sim | entra com deslocamento curto em `duration-move`, `ease-enter`; sai em `duration-window`, `ease-exit`; enquanto o dedo arrasta, sem transição |
| Troca de área pela barra | sim | só a folha esmaece, `duration-page`; a barra não pisca |
| Aviso passageiro (só para o que deu certo) | sim | uma linha, invertido: entra em `duration-move`, sai em `duration-window`, some sozinho |
| Barra lateral que recolhe, e a coluna do lugar (P19) | **não** | troca de largura na hora (hoje anima a largura). O botão de recolher que o mapa 5.3 decidiu muda o ícone na hora |
| Painel que dobra (linha de ferramenta, raciocínio, grupo) | **não** | abre na hora |
| Esqueleto de carregamento | sim | o pulso de hoje |
| Trabalho em andamento | sim | a marca Encaixe, o arco do compositor, o brilho; só enquanto o servidor diz que roda (princípio E4) |
| Mensagem nova na conversa, texto que chega | **não** | o texto aparece; nada desliza. A rolagem até o fim é suave |
| Linha que entra ou sai de uma lista ou tabela | **não** | aparece e some na hora |
| Erro e validação, inclusive o aviso escrito na tela | **nunca** | o que a pessoa precisa ler não espera uma entrada, e um erro não some sozinho |
| Abas com pílula, número que rola, tique que se desenha, botão que diz "fazendo" e "feito" | sim, quando a peça nascer (R3 e R5) | só por `transform` e opacidade; até lá, a troca é na hora |
| As peças de IA (linha de ferramenta, rastro, anexo, painel de tarefas) e a tabela | só no mouse | seguem as linhas do mouse, do painel que dobra e da mensagem nova |
| Página que fica pronta no painel da primeira entrada (alvo de JB5) | **não** | a palavra e o ponto mudam quando o servidor salva (E5); nada acende em sequência |

## 5. O que nunca anima

- Largura, altura, margem ou posição de leiaute. Fora a cor e a sombra, só opacidade, escala e
  deslocamento por `transform`.
- Erro, foco e validação.
- A carga da página: nada entra em sequência quando a tela abre.
- Um laço que não é trabalho em andamento.

## 6. Movimento reduzido

Com a preferência do sistema, **nada anima**, nem um esmaecer: toda duração vale zero e todo laço para,
com o estado final legível. O que confirma uma ação continua visível sem movimento: a chave muda de cor,
a janela aparece.

## 7. O que muda no código

A etapa R1 do redesenho leva esta folha: os tokens, a barra e o rastro sem esticar, o mouse e o toque,
as entradas e saídas, a troca de tela e o aviso. As peças novas vêm na R3 e na R5.
