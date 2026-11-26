# Roteiro do Conexus no repositório novo

## 1. A página do fundador

### O que o Conexus é, e a ordem de agora

Em 2026-11-09: "A gente não é o lovable, dyad, base44 que
cria app para ser deployado e vendido e acessado por pessoas, o intuito e objetivo do conexus é mais
o foco e ambiente empresarial conseguir desenvolver aplicativos para a empresa que facilite acesso a
informações, interpretações, uso de inteligência artificial, e que dê liberdade criativa o que
muitos ERPs e serviços utilizados travam."

Em 2026-11-17, ao refazer o [conceito](explanation/conceito.md): "é para empresas, industria, que tem
vários dados, conectores, sistemas desconexos e trazer isso tudo para uma camada de ontologia e
conhecimento".

A ordem, no mesmo dia: "primeiro mapeando e rastreando todas capabilidades que
faltam para a gente, primeiro construir elas muito bem, estudando vendo repositórios referência e
código e ir copiando o que der porém adaptado para o conexus e depois mapear todo o fluxo de
desenvolvimento do conexus, um dos primeiros seria a parte de pesquisa, depois a gente desenvolve a
parte de plano em conjunto com estratégia de construção, depois a gente foca em como é feito o
código, depois como é revisado, depois como é testado".

A 24.6 congela: "congelar 24.6", "a gente não vai construir agentes agora". Você julga o Builder: "eu
prefiro eu ser a régua".

Em 2026-11-14, ao parecer do conselheiro de produto: "1A. Duas trilhas", "2A. Catálogo primeiro,
Ontologia por cima", "3B. Identidade da empresa mais direção por app", "4A. Build semanal fixo"; à
lista de cortes, "Aceito todos"; à cadência, "Nao precisa por agora".

### A direção

O Conexus são três Solutions, Dados e contexto, Agentes e Apps, sobre a Plataforma
([VISION.md](../VISION.md)). Os agentes e os apps
chegam ao dado da empresa só pelo contrato de acesso, com três verbos: descrever, ler e agir. Atrás
do contrato podem estar as nossas cópias, no lago de cada empresa, na AWS
([0070](decisions/0070-copied-company-data-lives-in-a-lake-on-aws.md)); as ferramentas ao vivo do
kit, como o Gmail, que o agente consulta e nunca copia; e, mais tarde, a plataforma de dados ou o
banco que a empresa já tem, como o seu exemplo do Databricks ou os bancos que o Mitra liga direto.
Ideia nova entra pelo único estudo aberto de uma
trilha, nunca por fora do roteiro.

As trilhas andam juntas, cada uma na ordem dos seus marcos, com a página em
[steps/trilhas/](steps/trilhas/). A [spec dos dados](steps/trilhas/dados-spec/README.md).

**Trilha Dados.**

| Marco | O que a pessoa vê | Pronto quando |
| --- | --- | --- |
| `D1`. O primeiro sistema de catálogo | Liga o HubSpot ou o Gmail pela tela do Conexus, sem colar chave | Como a [trilha Dados](steps/trilhas/dados.md) descreve |
| `D2`. O dado copiado, visível a todo agente | Pergunta ao Assistente sobre um dado copiado e ele responde dizendo de quando é | Um registro mudado no sistema aparece no lago da empresa na rodada seguinte. Assistente, Builder e um agente salvo respondem pela mesma ferramenta de catálogo, com a hora da última cópia |
| `D3`. Onze sistemas reais com a mesma prova | Uma lista no Hub de sistemas que funcionam, com a data do teste | Onze sistemas passam no mesmo roteiro (ligar, ler, copiar, reconectar, desligar, e escrever com cartão onde houver) em conta real ou de teste |
| `D4`. A Ontologia sobre o catálogo | Pergunta por um conceito da empresa e o agente lê pelo conceito | `concept_read` devolve linhas do lago ou de uma leitura ao vivo, conforme o conceito diz. O Builder não tem mais a frase "cópia primeiro" no prompt |
| `D5`. Gatilhos | Um acontecimento no sistema inicia uma automação | Depende das suas decisões I e L. Um registro novo inicia o workflow com chave única |
| `D6`. A medição por empresa | Uma página com o uso de cada empresa | Tarefas de cópia, consultas ao lago, chamadas de conector e tokens por empresa, sem preço no repositório |

`D2` passa pelo lago em sete etapas, por capacidade de todo conector (2026-11-21: "G1 b"), mais a 3a, dos
arquivos, e o XML lido em linhas; depois vêm os conectores por classe e a porta
de fora. A 1 e a 2 fecharam; seguem o aviso de cópia parada e a 3. As etapas, os onze de `D3` e o
Brain estão na [trilha Dados](steps/trilhas/dados.md).

**Trilha Agentes e Apps.**

| Marco | O que a pessoa vê | Pronto quando |
| --- | --- | --- |
| `A1`. O Builder vê o que construiu | Menos apps "prontos" que não funcionam | Um teste planta um defeito visível e o Builder o corrige sem ninguém avisar. A conferência falha quando uma tela não está ligada. O estudo curto que compara máquina e Worker de verdade está feito antes |
| `A2`. Apps com identidade | Dois apps de empresas diferentes não se confundem. Os apps da mesma empresa parecem da mesma casa | O mesmo pedido em duas empresas de teste com identidades diferentes gera `styles.css` diferentes. Você distingue os dois em capturas lado a lado. O plano mostra a direção de design antes de construir |
| `A3`. O plano que trava e fecha | O Builder não escreve antes de você aprovar, e não diz "pronto" com item em aberto | Um teste em que o modelo tenta escrever antes da aprovação e o controlador recusa. Cada pedido numerado do plano aparece conferido no fim. O juiz de fim de turno roda nos quatro agentes e as frases saem dos prompts |
| `A4`. O segundo olhar | Uma revisão antes da entrega, feita por quem não construiu | Outra sessão revisa a versão exata, no máximo três voltas. Você julga se os dois apps de teste melhoraram com ela. Se não melhorarem, sai |
| `A5`. As capacidades 4, 6 e 7 | Como a página da [trilha](steps/trilhas/agentes-e-apps.md) descreve | As condições que cada cartão já traz |
| `A6`. O Assistente | Depois dos marcos acima | O estudo dele reaproveita `A3` e o contrato de `D2` |

A etapa 1 do harness, `A1` e a etapa 2 ("Uma sala e os nomes certos") fecharam; seguem `A2` e
`A3`. Mais na
[trilha Agentes e Apps](steps/trilhas/agentes-e-apps.md).

`A2` é a Capacidade 5 mais a direção de design de cada app. Os Fluxos 1 a 5 viram marcos: pesquisa e
plano em `A3`, código e teste em `A1`, revisão em `A4`.

**Trilha Redesenho:** [`R1` a `R6`](steps/trilhas/redesenho.md).

**O que brilha primeiro.** `D1`, `D2` e `A2`: ligar um sistema em um clique, perguntar sobre o dado
copiado e receber um app com a cara da empresa. `A1` vem junto, porque sem ele o `A2` entrega apps
bonitos e quebrados.

**O que não se faz agora.** O que nunca se faz está na [VISION.md](../VISION.md). Mais de um estudo
aberto por trilha. O auto-router. Subagentes forçados, pesquisa em três frentes e auditor do plano como
agente. Tratamento e qualidade dos dados antes do lago implementado (2026-11-20).

### O que você fornece, e quando

Já fornecido: Cloudflare (Workers Paid e Workers for Platforms), o Neon
grátis, as assinaturas de modelo, o E2B grátis, o R2, o usuário de leitura no Sankhya e a conta de
laboratório da AWS ([0072](decisions/0072-the-lab-aws-account-is-provisional.md)). O Neon Launch do Hub, uns
US$ 19,35 por mês, espera (2026-11-01).

### O que fica fora do lançamento

Login social. Arquivos enviados por pessoas para dentro de um app. Segundo idioma. Domínio de empresa.

### As suas respostas

1. **Código antigo só entra com os consertos médios e grandes feitos.** Em 2026-10-13: "2. A".
2. **A 16 vai para depois da 21.1, antes da 22** (2026-10-22).
3. **O roadmap perde o detalhe das etapas fechadas.** Em 2026-10-29: "Roadmap pode ir removendo o que foi de etapas passadas ... se não vamos ter que aumentar ele". O teto de 1.600 palavras não sobe.
4. **Sua empresa primeiro, as outras depois.** Em 2026-10-30: "eu vou começar na minha empresa ... depois disso ... eu vou jogar para as outras empresas".

## 2. As etapas depois das trilhas

Cada etapa espera a de cima, menos a conta oficial, que vem antes da 23; a 20.2 espera também os
webhooks.

| Etapa | Decisão sua nela | Conhecimento trazido |
| --- | --- | --- |
| 24.6 Workflows e automações: monta conversando o fluxo do orçamento do Sankhya. Congelada | O gatilho do Sankhya | Workflows dinâmicos do Mastra. Seu orçamento é o aceite |
| 24.7 Canais: o agente no Telegram | Nenhuma | Sem ninguém da empresa olhando, `toolApprovers: 'requester'`; até lá, nenhuma escrita que pergunta (`D1`) |
| 21.1 Ver o que acontece: a Atividade, o painel e o uso por empresa | Grafana no Brasil, provado | O OTel ao lado do rastro do Mastra no banco dele (0068) |
| 16 Atualizar sem cortar: conversa enquanto o Conexus é atualizado | Nenhuma | Consertos de execução da auditoria. Testes 9 e 10 |
| 22 Ensaio geral: restaura tudo junto | O lugar da cópia fora do Neon | Ensaios das etapas 2, 7, 9, 12 e 13 |
| A conta oficial da AWS: o lago na sua conta | Região, conta, cotas e certificado | A 0072, linha por linha |
| 23 As outras empresas usam o Conexus | Os riscos aceitos. O plano pago | A seção 11 da arquitetura |
| 20.2 App que se atualiza com um aviso do fornecedor | Nenhuma | S48, num workflow do Mastra |
