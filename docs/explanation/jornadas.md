# As jornadas

Estado: a Base aprovada em 2026-11-17, com JB5 redesenhada como alvo na segunda rodada; as outras áreas seguem como proposta

Este documento diz quem chega a cada área, o que quer, por quais telas passa e onde para hoje. Parte
do [conceito](conceito.md) e do [mapa das áreas](mapa.md). O que cada tela deve ter está em
[o que cada tela deve ter](../reference/telas.md). As escolhas que são do fundador seguem em aberto onde
ainda não foram decididas.

## 1. Como ler

- **A frequência é sempre hipótese.** Não há cliente (`PRODUCT.md`, "Evidence on Hand"). Cada linha
  diz de onde vem a hipótese (o papel, uma referência que mostra a mesma tarefa, ou o roteiro).
- **O que quer** cita o resultado do conceito pelo número (`C1` a `C7`, G1 a G9, A1 a A8). Onde a
  ligação da jornada a um resultado é conclusão e não está dita no conceito, a linha diz "inferido".
- **Onde para hoje** cita o código (caminho em `apps/web/src/`, salvo quando o caminho diz outro).
- **Hipótese, fora do repositório até o estudo do marco** marca a jornada de uma feature que não existe.
  Ela não vira exigência antes do estudo do seu marco.
- O story map de cada área põe as atividades em colunas e as entregas em três faixas (Hoje, Marco
  seguinte, Depois). Cada célula traz o marco do roteiro. "H" quer dizer hipótese, sem marco.
- Um ponto de fronteira entre áreas. A rota `projects/$projectId.conversations.$conversationId.tsx` saiu com o Builder antigo.

As pessoas são as cinco da seção 2 do [conceito](conceito.md). Quem só usa um app passa só pela Base
(Entrada) e pelo fim da jornada de Apps. Quem opera a instalação passa só pela Central.

## 2. As jornadas por área

### 2.1 Base

A Base não é área de trabalho (seção 2 do [mapa](mapa.md)). É onde se entra, se prepara a empresa, se
configura e se opera a instalação.

#### Entrada

| Quem chega | O que quer | Frequência (hipótese, fonte) | Telas em ordem | Onde para hoje | Marco que muda |
| --- | --- | --- | --- | --- | --- |
| **JB1. Quem conhece a operação** (Membro), convidado | Entrar e perguntar sobre a operação (G1) | A maioria das pessoas da empresa. Vem do conceito, seção 2 | Convite > Criar senha > Entrar > Início | Convite inválido e convite usado dão a mesma tela de "não encontrado", com marca e frase em dobro (`ui/states.tsx` e `ui/frame.tsx`). O convite diz o nome do papel e não o que ele permite (`hub/identity/invitation.tsx`). A sessão cai com 30 min parada e a pessoa não vê isso (`apps/server/src/hub/identity/auth.ts`) | Nenhum. Segurança da conta está sem marco (mapa 6.2) |
| **JB2. Qualquer pessoa** que esqueceu a senha | Voltar a entrar (a porta, sem resultado numerado) | Ocasional. Vem de toda tela de login com senha | Entrar > Esqueci a senha > e-mail com link de 1 h > Criar senha nova > Entrar | Depois de criar a senha a pessoa cai em Entrar e digita tudo de novo (`hub/identity/set-password-form.tsx`), enquanto no convite já fica entrada (`hub/identity/invitation.tsx`). O limite de 3 pedidos por minuto (`auth.ts`) chega como frase do servidor | Nenhum |
| **JB3. Quem só usa um app** (pode ser de fora da empresa) | Abrir o app a que tem acesso (A6, inferido) | O maior grupo no futuro. Vem do conceito, seção 2 | E-mail do convite > Criar senha > Aceitar convite > o app; ou "Seus apps" > o app; na recusa, Abrir app recusado | A recusa não diz a quem pedir o acesso (`hub/apps/app-refused.tsx`). Sem empresa, "Você ainda não está em nenhuma empresa." não diz o que fazer (`hub/identity/no-company.tsx`) | `A2` muda o que a pessoa vê dentro do app, não o caminho até ele |
| **JB4. Quem cuida da segurança da própria conta**. Hipótese, fora do repositório até o estudo do marco | Ver e encerrar sessões, trocar a senha | Ocasional. Vem do exemplo da biblioteca de autenticação e da área "Security" de uma plataforma de referência | Minha conta > Segurança (não existe) | Não existe. A lista de operações de identidade só tem entrar, ver sessão, sair, criar senha e pedir link (`packages/hub-api/src/identity.ts`) | Sem marco (mapa 6.2) |

#### Primeira entrada

Decidido pelo fundador em 2026-11-17, na segunda rodada, quando JB5 foi reaberta: Entrada 1 (a), a ordem do
cartão "A entrada conversada" (PR 982, decisões J1, H1, I1 e B1 de 2026-11-12) com a forma de uma
referência; Entrada 2 (a), a entrada conversada se constrói depois da Ontologia, item 6 do Brain
(`docs/steps/trilhas/dados.md`), e esta camada a desenha agora como alvo; Entrada 3 (a), o Assistente
lê o site da empresa antes de perguntar.

**JB5, o alvo** (constrói-se com o item 6; até lá valem os consertos pequenos de TB9, TB10 e TB11):

| Passo | O que a pessoa faz | Fonte |
| --- | --- | --- |
| 1 | Sua empresa: o apelido | hoje |
| 2 | Conta de modelo, com o link para gerar a chave | TB9 (o `KeyForm` já explica a chave, `key-form.tsx`); uma referência |
| 3 | Convide sua equipe, com a lista dos enviados | TB10 |
| 4 | Ligue seus sistemas, que se pode pular | J1; uma referência deixa pular tudo |
| 5 | Começar a conversa: o Assistente diz o que leu do site e dos sistemas, pergunta só o que vale para a empresa inteira, com opções clicáveis e recusa barata; cada resposta vira proposta de página, que só vale com Salvar, e as páginas acendem ao lado | H1, B1, Entrada 3; uma referência |
| 6 | A primeira demanda vai ao Builder com o que ficou em aberto | cartão do PR 982, roteiro passo 4 |
| 7 | No Início, o que ficou em aberto, com o que desliga e Responder | I1; o roteiro de uso do cartão do PR 982, passo 5 |

Fica fora da entrada: documentos (item 8 e 0065 `C1`), o inventário ao ligar (F1, `D1` e `D2`), conceitos e o Mapa (`D4`).

| Quem chega | O que quer | Frequência (hipótese, fonte) | Telas em ordem | Onde para hoje | Marco que muda |
| --- | --- | --- | --- | --- | --- |
| **JB5. Quem prepara a empresa** (o primeiro Dono), primeira vez | Deixar a empresa pronta para a primeira conversa. `C4` e G4 pelo lado do modelo (inferido: o passo pede conta de modelo, apelido e equipe) | Uma vez por empresa. Vem do roteiro ("sua empresa primeiro, as outras depois") | Convite > Criar senha > Sua empresa (apelido) > Ligue uma conta de modelo > Convide sua equipe > O que vamos construir primeiro? > Projeto em Construir | O passo 2 é uma frase e dois botões, sem link para gerar a chave nem custo. O passo 3 envia um convite por vez e não lista os enviados. O passo 4 só oferece um app como primeiro resultado. O que foi pulado vira o cartão "Termine de preparar a empresa" no Início (`hub/identity/preparation-card.tsx`) | Etapa 23, "as outras empresas usam o Conexus" (`docs/roadmap.md`). O alvo acima, com o item 6 do Brain, depois da Ontologia |

#### Configurações

| Quem chega | O que quer | Frequência (hipótese, fonte) | Telas em ordem | Onde para hoje | Marco que muda |
| --- | --- | --- | --- | --- | --- |
| **JB6. Quem prepara a empresa** (Dono, Administrador), no dia a dia | Mudar quem entra, o que cada papel lê e as contas de modelo (`C6`) | Poucas vezes por mês. Vem do papel de administração e das referências, que põem isso em Configurações | Entrar > Configurações > Pessoas e convites > Papéis > Contas da empresa e Troca automática > Padrões da empresa > Memória observacional | Mudar papel só diz "Papel atual: X." (`hub/identity/member-actions.tsx`). Dar acesso a app mora em dois lugares, "Quem usa os apps" aqui e "Quem usa o app" no Projeto. "Contas de modelo" mistura dois donos numa página (`harness/model-accounts/my-accounts.tsx`) | A divisão por dono do mapa 6.4; U9, o Registro de leituras |
| **JB7. Quem monta** (Desenvolvedor) | Entrar e começar a construir (A1) | Poucas pessoas por empresa. Vem do conceito | Entrar > Início > Construir (fora da Base); nas Configurações lê tudo, menos Papéis | Não vê Papéis nem o endereço deles (`needs: 'manageRoles'`, `routes/_app/companies/$companyId_/settings/roles.tsx`). A conta de modelo dele mora numa página de dois donos | A divisão de Contas de modelo (mapa 6.4) |

#### Central

| Quem chega | O que quer | Frequência (hipótese, fonte) | Telas em ordem | Onde para hoje | Marco que muda |
| --- | --- | --- | --- | --- | --- |
| **JB8. Quem opera a instalação** (o fundador) | Pôr uma empresa nova no ar e saber que o primeiro Dono entrou (sem resultado numerado) | Uma vez por empresa nova, poucas. Vem do roteiro ("sua empresa primeiro") | Entrar > Clientes > Cadastrar cliente > Cliente (aguardando) > o Dono faz Convite, Criar senha e Primeira entrada | O Cliente só diz "Aguardando o administrador" e o prazo do convite, 2 dias (`apps/server/src/hub/identity/organization.ts`). Não diz se o Dono abriu o e-mail nem em que passo está (inferido de `hub/operations/client.tsx`) | Etapa 23 (`docs/roadmap.md`) |

#### Story map da Base

| Faixa | Chegar e entrar | Preparar a empresa | Ajustar | Acompanhar e operar |
| --- | --- | --- | --- | --- |
| **Hoje** | Entrar, Esqueci a senha, Criar senha, Convite, Abrir app recusado, Seus apps | Primeira entrada em 4 passos; o que foi pulado vira cartão no Início | Configurações em dois grupos (Você, a empresa); Contas de modelo com dois donos; Memória da empresa nas Configurações | Central com Clientes, Cadastrar cliente, Cliente, Estado do Hub |
| **Marco seguinte** | A recusa diz a quem pedir, sem nome (E3 b) | Os consertos de TB9 (link para a chave), TB10 (lista dos convites enviados) e TB11 (o app deixa de ser o único fim) | Mapa 6.4, com Você; Empresa com Geral, Pessoas e acesso, Modelos; Contas de modelo em duas páginas; Memória da empresa vai para Conhecimento | Sem mudança |
| **Depois** | (H) Segurança da conta (sem marco) | O alvo de JB5, com o item 6 do Brain, depois da Ontologia; Identidade da empresa (`A2`, "3B") | Registro de dados (U9); Chaves para agentes de fora (`docs/steps/trilhas/dados.md`); Limites por provedor (etapa 20, decisão 0058); Avisos (etapa 2 do lago); Uso (`D6`); Atividade (21.1); Plano e cobrança (etapa 23) | (H) busca e última atividade na lista de clientes (uma referência, sem marco) |

### 2.2 Dados e contexto

As telas são Integrações, Dados (com a tabela), Cópias (redireciona), Integrações e Dados do Projeto,
Conhecimento. Quem só usa um app e quem opera a instalação não passam aqui.

| Quem chega | O que quer | Frequência (hipótese, fonte) | Telas em ordem | Onde para hoje | Marco que muda |
| --- | --- | --- | --- | --- | --- |
| **JD1. Quem prepara a empresa**, ligando o primeiro sistema | Ligar o sistema pela tela, sem colar chave, e ver cada um funcionando ou parado (`C1`) | Uma vez por sistema, no início, e de novo quando uma chave é recusada. Vem do papel e do roteiro `D3` (onze sistemas) | Integrações > janela Ligar > página da ligação, que testa sozinha (`?testar`) > Dados | Sankhya liga colando chaves (`hub/connectors/link-dialog.tsx`). O mesmo sistema aparece em "Ligadas" e em "Para ligar" (`hub/connectors/integrations.tsx`). A página da ligação não diz o que entrega nem quem a usa (`connection-page.tsx`). A ligação nova sem teste não tem palavra de estado (`text.ts`) | `D1` (login do kit no HubSpot e no Gmail), `D3` (onze sistemas com data do teste) |
| **JD2. O mesmo Dono, já ligado**, escolhendo o que copiar e quem lê | Ver todo o dado num catálogo (`C2`), decidir o que cada papel lê (`C6`), ver o que parou (`C1`) | Algumas vezes na primeira semana por sistema, depois ocasional. Vem do roteiro `D2` e do catálogo das plataformas de dados de referência | Dados > tabela (Visão geral, Colunas, Amostra, Rodadas) > Quem lê > Papéis | A cópia nasce "Aguardando a próxima rodada" com linhas e última rodada em traço. A coluna "Atualizada" mistura estado e hora (`copy-list.tsx`). A lista não filtra por sistema nem estado (`raw-layer.tsx`). Quem lê está numa aba e a mudança vai a Papéis (`copy-readers.tsx`) | Registro e conformidade (Registro de dados); o aviso de cópia parada na etapa 2 do lago; `D2` |
| **JD4. Quem monta** (Desenvolvedor, também Dono e Administrador), querendo que o app ou o agente do Projeto leia o dado | O app lê o dado pelo mesmo contrato dos agentes (`C2`, A5); o agente com as ligações que pode usar (G4) | Uma vez por Projeto, depois conferir. Vem do papel e da decisão J1 (o Projeto é a casa do que roda) | Menu do Projeto > Integrações > Liberar para ler > Cópias (Liberar) > Dados do Projeto > linhas da cópia | O Desenvolvedor só lê, "Peça ao dono ou a um administrador" (`project-integrations.tsx`; `project-copies.tsx`). Liberar ligação confirma, liberar cópia não (`project-copies.tsx`). Liberar fica em Integrações do Projeto; Dados do Projeto só lista o que foi liberado (`hub/apps/data.tsx`). As linhas da cópia não dizem de quando são nem de que sistema (`hub/apps/data-rows.tsx`) | `D2`, `A5` |
| **JD5. Aprovar um conceito proposto** (quem gerencia). Hipótese, fora do repositório até o estudo do marco | Ver a proposta, a tabela e a prova, e aprovar (`C3`, `C5`) | Semanal. Vem da revisão semanal "que só propõe" (`docs/steps/trilhas/dados.md`, item 9) e do catálogo de conhecimento de uma plataforma de dados de referência | Conhecimento > Propostas > o conceito > aprovar | Não existe | A etapa do Negócio, com estudo próprio |
| **JD6. Ver o contexto aprender** (quem conhece a operação). Hipótese, fora do repositório até o estudo do marco | O que o agente aprendeu como proposta; aviso quando a prova quebra (`C5`, `C7`) | Contínua. Vem do princípio E2 | Conhecimento (propostas), Início (aviso) | Não existe | Trilha Dados, item 3 (saúde da Ontologia), sem cartão |
| **JD7. Ler o Mapa** (quem conhece a operação, quem monta). Hipótese, fora do repositório até o estudo do marco | Ver conceitos e ligações como mapa (`C4`) | Ocasional. Vem do mapa 3.1 e do grafo de conhecimento de uma referência | Conhecimento > Mapa | Não existe | O Brain, trilha Dados item 5, depois de `D4` |
| **JD8. Receber o aviso de cópia parada** (quem pode consertar a cópia: Dono e Administrador, e os e-mails da ligação, 2026-11-23). Hipótese, fora do repositório até o estudo do marco | Saber quando um sistema para (`C1`) | Um aviso quando a cópia para e um lembrete por dia enquanto continuar parada (2026-11-21, "R1 a R2 a"). Quem lê a tabela vê a parada na página Dados e no bloco Fontes | sino e e-mail > tabela (Rodadas) > Integrações | Não existe; saiu do cartão do Registro e tem cartão próprio, logo depois da etapa 2 do lago (`docs/steps/trilhas/dados.md`) | O cartão do aviso, depois da etapa 2 do lago |

#### Story map de Dados e contexto

| Faixa | Ligar o sistema | Ver que funciona | Copiar o dado | Ver o dado | Decidir quem lê | Liberar ao Projeto | Dar sentido | Guardar como a empresa opera | Ver o contexto aprender |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **Hoje** | Janela Ligar, chaves coladas ou login OAuth (Sankhya, Mercado Livre, HubSpot) | Funcionando ou chaves recusadas; Testar; Caderno | Nenhuma: o motor que cria cópia saiu no G0a e a cópia do lago ainda não chegou | Dados com árvore, tabela, Colunas, Amostra, Rodadas | Aba Quem lê; Papéis | Liberar ligação e cópia no Projeto | Pasta Negócio vazia | Memória da empresa nas Configurações | Cartão de proposta do Assistente (salva quem gerencia) |
| **Marco seguinte** | `D1`, login do kit no HubSpot e no Gmail | `D3`, onze sistemas com data do teste | O aviso de cópia parada (etapa 2 do lago) | `D2`, o Assistente cita a hora da cópia | Registro de dados (Registro) | `D2`, o mesmo contrato para app e agente | Etapa do Negócio e `D4` | Conhecimento nasce no trilho (mapa 3.1) | (H) propostas à espera em Conhecimento |
| **Depois** | `D3`, onze sistemas com a mesma prova | (H) saúde do sistema refeita todo dia | `D5`, gatilho por acontecimento | (H) Mapa e busca por significado | (H) chaves para agentes de fora | (H) conceitos liberados ao app (`A5`) | Ligações e duas fontes (trilha, item 4) | O Brain, fontes de conhecimento (trilha, itens 5 e 8) | Saúde da Ontologia, revisão semanal (trilha, itens 3 e 9) |

### 2.3 Agentes

As telas são Início, conversas, coluna de conversas, Agentes e Automações da empresa, Conversas, Agentes,
Ferramentas, Construtor e Automações do Projeto. O que a conversa com mensagens mostra está só no código.

| Quem chega | O que quer | Frequência (hipótese, fonte) | Telas em ordem | Onde para hoje | Marco que muda |
| --- | --- | --- | --- | --- | --- |
| **JG6. Quem monta**, automatizando por acontecimento. Hipótese, fora do repositório até o estudo de `D5` | Um registro novo no sistema inicia o trabalho (G6) | Sem fonte além do roteiro | (H) Automações (novo gatilho) > Automação (execuções com o registro que disparou). As referências oferecem gatilhos por evento e vigia do sistema | Não existe | `D5`; decisões I e L do fundador (`docs/roadmap.md`) |

#### Story map de Agentes

| Faixa | Perguntar | Analisar e propor | Criar agente | Ferramentas e ligações | Publicar e versionar | Automatizar | Acompanhar |
| --- | --- | --- | --- | --- | --- | --- | --- |
| **Hoje** | Início com caixa e "Continuar"; conversa da empresa e do Projeto (G1 em parte) | Arquivo ao lado (G3); cartões de app, automação e memória | Construtor e página do agente (G4) | Ferramentas por ligação; aba Ferramentas; Nova versão | Publicar com mensagem; Versões; Pergunta antes ou Faz sozinho (G7) | Por horário: cartão, lista, execuções (G5) | "Rascunho", "Versão n", "Rodou há..."; histórico por automação |
| **Marco seguinte** | `D2`, fonte e hora na resposta; `A6`, Assistente e Supervisor | `A3`, plano na conversa (de Apps, mesma casca) | Sem marco (24.6 congelada) | `D1`, ligação pelo login do kit; escrita com cartão | `D1`, prova da escrita | `D5`, por acontecimento (G6) | (H) sem marco antes de `21.1` |
| **Depois** | `D4`, perguntar pelo conceito (G2) | (H) sem marco | (H) modelos de agente (as referências oferecem) | (H) limite por agente (uma referência) | (H) "Adicionar à biblioteca" (uma referência) | `24.6` workflows (congelada) | `21.1`, Atividade (G9); G8, todo agente com o mesmo conhecimento (trilha Dados, item 7) |

### 2.4 Apps

As telas são Todos os projetos, Novo projeto, a moldura do Projeto, Construir (Conversa do Builder, Prévia,
Código, Alterações), Sobre, Versões, Quem usa o app. O fim da jornada de quem só usa um app (Abrir app
recusado, Seus apps) tem ficha na Base, porque mora na Entrada.

| Quem chega | O que quer | Frequência (hipótese, fonte) | Telas em ordem | Onde para hoje | Marco que muda |
| --- | --- | --- | --- | --- | --- |
| **JA2. Quem prepara a empresa** (Dono, Administrador) | Decidir quem usa cada app e voltar a uma versão (A6); publicar e apagar com aviso (E4) | A cada app novo, uma publicação e um convite; versões a cada correção. Vem do papel | Todos os projetos > o Projeto > "Pedido de publicação" > Publicar > Sobre > Versões > Quem usa o app > Dar acesso > às vezes Apagar Projeto | Publicar diz "Quem abrir o app passa a ver esta versão", sem dizer quem (`hub/apps/publish.tsx`). Dar acesso exige publicar antes (`hub/projects/access.tsx`). Versões não diz o que mudou (`hub/apps/versions.tsx`). A lista de projetos não mostra qual tem pedido aberto (`packages/hub-api/src/projects.ts`) | `A3`, `A4` (o segundo olhar, `docs/roadmap.md`) |
| **JA4. Quem só usa um app** | Abrir o app publicado; do Hub, ver só "Seus apps" | A mais frequente em número de pessoas e a de menor contato com o Hub. Vem do conceito, seção 2 | E-mail do convite > Criar senha > Aceitar convite > o app (ou "Seus apps" > o app); na recusa, Abrir app recusado | "Seus apps" é uma lista de links (`hub/identity/no-company.tsx`). A recusa usa a mesma frase para app que não existe e app sem acesso, de propósito (S10), e só oferece "Ir para o Início" (`hub/apps/app-refused.tsx`) | Nenhum muda o fim. `A2` muda o que se vê dentro do app |
| **JA5. Quem pede o app vê o plano e a conferência**. Hipótese, fora do repositório até o estudo do marco | A2, A3, A8 | Sem fonte de frequência | Construir, com o plano para aprovar antes do código, pedidos conferidos no fim | Não existe tela | `A3`, `A4` |
| **JA6. Quem monta acompanha por Alterações**. Hipótese, fora do repositório até o estudo do marco | A7 | Sem fonte de frequência | Construir > Alterações | Não existe (W31, `docs/guides/web.md`, a promete) | Sem marco no roteiro |
| **JA7. Dono ou Administrador restaura um Projeto apagado**. Hipótese, fora do repositório; não é resultado do conceito | Desfazer um apagar | Sem fonte de frequência | Todos os projetos > apagados > restaurar (uma referência guarda os projetos apagados por um tempo) | Hoje "Isto não se desfaz" (`hub/projects/delete-project-dialog.tsx`) | Nenhum. É escolha do fundador, em aberto |

#### Story map de Apps

| Faixa | Achar o Projeto | Pedir o app | Ver a prévia e conferir | Ler o código e o que mudou | Publicar e voltar a uma versão | Dar acesso | Usar o app |
| --- | --- | --- | --- | --- | --- | --- | --- |
| **Hoje** | Todos os projetos em cartões, 50 por página | Novo projeto (só o nome) e a Conversa de Construir | Prévia em moldura de navegador, Computador e Celular | Código: árvore e um arquivo por vez | Publicar, Pedir para publicar, Versões com "Publicar esta" | Quem usa o app: papel por pessoa, convite, tirar | "Abrir app"; "Seus apps"; recusa com frase única |
| **Marco seguinte** | (H) sem coluna de conversas (mapa 4); busca, estado e ordem (as referências) | `A3`, plano que trava e fecha; `A1`, o Builder vê o que construiu | `A3`, conferência pedido a pedido; `A2`, a cara da empresa | (H) aba Alterações (W31) | (H) "Versão ▾" no alto (W31); o que muda antes de publicar (uma referência) | O mesmo, com os papéis da versão publicada | O mesmo |
| **Depois** | (H) Projeto sem app, para agentes (já existe, "Ainda sem app") | `A4`, segundo olhar; `A5`, `D2`, 0064: o app lê os conceitos | `A5`, prévia com o dado de verdade | (H) comparar duas versões | (H) restaurar Projeto apagado | (H) acesso por grupo (uma referência) | (H) nada sem estudo |

## 3. As jornadas que cruzam áreas

Cada passo diz a área e a tela. Onde a tela só existe no código, a linha diz.

| Jornada | Quem | Resultados | Passos, com a área | Onde para hoje | Marcos |
| --- | --- | --- | --- | --- | --- |
| **JX5. Um app pedido, publicado e aberto por quem é de fora** | Membro pede; Dono publica e dá acesso; quem só usa abre | A1, A6 | Em Apps, Construir > Pedir para publicar > (Dono) Publicar > Quem usa o app > Dar acesso. Na Base, Convite > Criar senha > o app, ou Abrir app recusado. Na Base, Configurações > Pessoas e convites > "Quem usa os apps" | Dar acesso exige publicar antes (`hub/projects/access.tsx`). O mesmo acesso tem duas listas, por Projeto e na empresa (`docs/approvals/e18-entrar-num-app.md`). A recusa não diz a quem pedir (`hub/apps/app-refused.tsx`) | `A3`, `A4` |

## 4. O que este documento não decide

- O desenho de nenhuma tela nem a cor. Isso é a camada de área, A1 a A3.
- As escolhas de produto que as jornadas pedem. São do fundador e seguem em aberto onde ainda não foram decididas.
- A frequência de nada. Toda frequência é hipótese até haver uso real.
