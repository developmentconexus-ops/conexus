# O que cada tela deve ter

Estado: a Base aprovada em 2026-11-17, com E1 (b), E2 (b), E3 (b) e E4 (a), e a primeira entrada desenhada como alvo (Entrada 1 a 3, todas a); Dados e contexto, Agentes e Apps seguem como proposta, aprovadas por área; E5 a E17 seguem em aberto e voltam na aprovação de cada área.

Este documento é o parte da camada de produto. Uma ficha por tela de hoje e por tela que o mapa
aprovado criou. Não decide leiaute nem cor, que são da camada de área, A1 a A3. As jornadas estão em
[as jornadas](../explanation/jornadas.md); o mapa, em [o mapa](../explanation/mapa.md); as escolhas do
fundador aparecem em cada ficha como "Decidido".

Como ler uma ficha:

- Os campos são sempre os mesmos nove. Um campo ainda sem decisão diz "em aberto" e não inventa.
- Os caminhos de código são relativos a `apps/web/src/`, salvo quando o caminho começa em `apps/server/` ou
  `packages/`.
- **Referência** descreve o padrão que as referências seguem, sem nomear produto de terceiros.
- **Faixa de dados.** Número tirado do código é dado do código; o resto é **hipótese**.
- **Princípios.** P passa, F falha, "em parte" quando a ficha diz. E1 a E7 são do [conceito](../explanation/conceito.md), seção 4.
- "Quem gerencia" quer dizer Dono e Administrador. O Desenvolvedor e o Membro leem e não gerenciam,
  salvo onde a ficha diz.

## 1. Base

### Entrada

#### TB1. Entrar (`/login`)

- **Para que serve.** Provar quem é a pessoa para abrir a empresa dela. É a porta; não atende a um resultado só.
- **Conteúdo obrigatório.** Aviso de motivo, quando há (4 motivos, `hub/identity/sign-in-form.tsx`); título "Entrar no Conexus"; "Use o seu e-mail de trabalho."; E-mail (preenchido quando vem de um convite, `routes/_public/login.tsx`); Senha; erro do servidor acima do botão; Entrar; "Esqueci minha senha" (`sign-in-form.tsx`).
- **Ações.** Entrar e Esqueci minha senha, qualquer pessoa sem sessão. Quem tem sessão é mandado adiante (`login.tsx`).
- **Ação principal.** Entrar.
- **Estados.** Vazio; "Entrando…"; erro "E-mail ou senha não conferem."; limite de 10 tentativas por minuto (`apps/server/src/hub/identity/auth.ts`); com aviso de motivo; com e-mail preenchido. Sem permissão não se aplica.
- **Faixa de dados.** E-mail de 5 a cerca de 100 caracteres (hipótese, e-mail corporativo). Senha de 8 a 128 (`packages/hub-api/src/identity.ts`).
- **Hoje falta.** Mostrar ou ocultar a senha, que só o convite tem (`hub/identity/invitation.tsx`). A tela não diz que a sessão cai com 30 min parada (`auth.ts`).
- **Referência.** A demonstração do Better Auth mostra login social, passkey e "último método usado". Uma plataforma de dados, depois de entrar, cai direto na criação do espaço.
- **Princípios.** E5 P (o aviso diz o que aconteceu). E7 P. E1 e E4 não se aplicam.

#### TB2. Esqueci minha senha (`/forgot-password`)

- **Para que serve.** Devolver o acesso sem revelar se o e-mail existe. A porta.
- **Conteúdo obrigatório.** "Esqueci minha senha"; "Escreva o e-mail da sua conta para receber um link."; E-mail; "Enviar o link"; "Voltar para entrar". Depois de enviar: "Veja o seu e-mail" e "Se houver uma conta com esse e-mail, enviamos um link. Ele vale por 1 hora." (`hub/identity/forgot-password-form.tsx`).
- **Ações.** Enviar o link e Voltar, qualquer pessoa.
- **Ação principal.** Enviar o link.
- **Estados.** Vazio; "Enviando…"; enviado, exista ou não a conta; limite de 3 pedidos por minuto (`auth.ts`); erro de rede também aparece como enviado.
- **Faixa de dados.** E-mail, como em TB1.
- **Hoje falta.** Nada para a tarefa. A pessoa que erra o e-mail não sabe que errou; é o preço da regra.
- **Referência.** A demonstração do Better Auth usa um campo e um botão, igual.
- **Princípios.** E1 P ("vale por 1 hora"). E5 P. E7 P.

#### TB3. Criar senha e Criar senha nova (`/set-password`)

- **Para que serve.** Definir a senha com o link recebido, na primeira vez ou na recuperação. A porta.
- **Conteúdo obrigatório.** "Criar sua senha" ou "Criar senha nova" (`hub/identity/set-password-form.tsx`); "Escolha uma senha de 8 caracteres ou mais."; Senha; Repita a senha; "Criar a senha". Link morto: "Este link já foi usado ou venceu. Peça um link novo." e "Pedir outro link".
- **Ações.** Criar a senha; Pedir outro link. Quem tem o link.
- **Ação principal.** Criar a senha; no link morto, Pedir outro link.
- **Estados.** Vazio; "Criando…"; erro de validação; link morto; sucesso leva a Entrar com o aviso "Senha criada" ou "Senha trocada".
- **Faixa de dados.** Senha de 8 a 128; a tela diz o mínimo e não o máximo.
- **Hoje falta.** Mostrar ou ocultar a senha (`hub/identity/invitation.tsx` tem; aqui não). Depois de criar a senha a pessoa digita tudo de novo em Entrar, enquanto o convite já a deixa entrada (`invitation.tsx`). Trocar a senha encerra as outras sessões (`auth.ts`) e a tela não diz.
- **Referência.** A demonstração do Better Auth tem a mesma forma; a documentação anuncia, como opção, encerrar as outras sessões ao trocar a senha.
- **Princípios.** E7 F (duas peças para criar senha). E5 P.

#### TB4. Convite (`/invitations/$invitationId`)

- **Para que serve.** Ver quem convidou, para quê e até quando, e aceitar ou recusar; quem não tem conta cria a senha ali. A porta de toda pessoa convidada; passa por A6.
- **Conteúdo obrigatório.** Título que diz o que o convite dá, em 4 formas (`hub/identity/invitation.tsx`); "Válido até dd/mm/aaaa hh:mm.". Por caso: pessoa nova (Nome, Senha, Confirmar, mostrar senha, Criar senha, Recusar); tem senha sem sessão (Entrar); sessão certa (Aceitar, Recusar); outro e-mail; já é membro ou já usa o app; fechado, em 4 frases. Inexistente: "Não encontramos o que você procurou.".
- **Ações.** Criar senha, Entrar, Aceitar, Recusar (a pessoa convidada); Sair e abrir o convite; Abrir empresa ou Abrir app.
- **Ação principal.** Uma por caso (Criar senha, ou Entrar, ou Aceitar convite).
- **Estados.** Os seis casos acima; "Senha criada. Você já entrou."; sem permissão é o caso "outro e-mail"; carregando e erro do roteador.
- **Faixa de dados.** Validade 2 dias (`apps/server/src/hub/identity/organization.ts`). Apelido do app de 3 a 30 (`packages/hub-api/src/address.ts`). Nomes de pessoa, empresa e app até cerca de 60 a 80 (hipótese).
- **Hoje falta.** O convite inválido mostra duas marcas e duas frases (`ui/states.tsx` e `ui/frame.tsx`). Diz o nome do papel e não o que ele permite. Recusar vale na hora, sem confirmação. Depois de Aceitar não há frase de chegada.
- **Referência.** A demonstração do Better Auth diz para qual e-mail o convite foi e tem frase de chegada ("Welcome to X!").
- **Princípios.** E4 em parte. E6 F no convite com papel. E7 F no estado inválido. E5 P.

#### TB5. Abrir app recusado (`/apps/open`)

**Decidido.** E3 (b): a mesma frase e mais "peça a quem administra a empresa", sem nome.

- **Para que serve.** Dizer, fora do Hub, que o app não existe ou a pessoa não tem acesso, com a mesma frase nos dois casos (S10). A6 do lado de quem tenta abrir.
- **Conteúdo obrigatório.** A marca; "Este app não existe ou você não tem acesso a ele."; "Ir para o Início" (`hub/apps/app-refused.tsx`). O Hub abre a tela só quando recusa (`routes/_public/apps/open.tsx`).
- **Ações.** Ir para o Início, qualquer pessoa.
- **Ação principal.** Ir para o Início.
- **Estados.** Só a recusa. A recusa por sessão vencida: em aberto.
- **Faixa de dados.** Uma frase fixa.
- **Hoje falta.** Dizer a quem pedir o acesso. Decidido (E3 b): a mesma frase e mais "peça a quem administra a empresa", sem nome, o que mantém S10.
- **Referência.** Uma plataforma de aplicativos diz, na recusa, para falar com o administrador.
- **Princípios.** E6 F em parte. E5 P. E7 P.

#### TB6. Seus apps (`/` sem empresa)

- **Para que serve.** Quem não está em nenhuma empresa vê os apps que usa. Atende quem só usa um app (conceito, seção 2).
- **Conteúdo obrigatório.** Sem apps: "Você ainda não está em nenhuma empresa."; com apps: "Seus apps" e uma linha por app com o nome do app e da empresa; sair (`hub/identity/no-company.tsx`).
- **Ações.** Abrir um app (quem tem o acesso); Sair.
- **Ação principal.** Abrir um app; sem apps, nenhuma.
- **Estados.** Vazio; lista; muitos dados sem paginação; carregando e erro do roteador.
- **Faixa de dados.** De 0 a sem limite no código; típico 1 a 5 (hipótese, conceito seção 2).
- **Hoje falta.** A frase de vazio não diz o que fazer (pedir um convite).
- **Referência.** Nenhuma para "só apps". Uma plataforma de dados tem troca de espaço, que não lista apps.
- **Princípios.** E6 P, em parte na frase de vazio. E7 P.

### Primeira entrada

A Primeira entrada é do Dono, uma vez (web W33). Quem não é Dono vai ao Início (`hub/identity/enter-company.ts`). A moldura é `ui/welcome-frame.tsx`: "Passo n de 4", barra de progresso, "Voltar" nos passos 3 e 4, "Sair do Conexus".

#### TB7. Índice da primeira entrada (`/companies/$c/welcome`)

- **Para que serve.** Abrir a pessoa no passo que falta. Não tem tela, só redireciona (`welcome/index.tsx`).
- **Conteúdo obrigatório.** Nenhum.
- **Ações.** Nenhuma.
- **Ação principal.** Não há.
- **Estados.** Sem conta de modelo da empresa, passo 2; sem equipe, passo 3; com tudo, passo 4.
- **Faixa de dados.** Não se aplica.
- **Hoje falta.** Nada. Só a conta da **empresa** conta; a pessoal não (`hub/identity/preparation.ts`).
- **Referência.** Nenhuma.
- **Princípios.** E5 P (o passo vem do servidor).

#### TB8. Passo 1, Sua empresa (`/welcome/company`)

- **Para que serve.** O Dono escolhe o apelido, que entra no endereço dos apps. Atende A1.
- **Conteúdo obrigatório.** "O apelido vai no endereço dos apps da empresa. Depois de salvo, não dá para trocar."; Nome da empresa só leitura; Apelido sugerido; exemplo de endereço que muda ao digitar; erro no campo; "Salvar e continuar" (`hub/identity/welcome-company.tsx`).
- **Ações.** Salvar e continuar; Sair. O Dono.
- **Ação principal.** Salvar e continuar.
- **Estados.** Sugerido; "Salvando…"; apelido em uso, reservado ou inválido; já salvo segue ao passo 2.
- **Faixa de dados.** Apelido de 3 a 30 (`address.ts`). Nome até cerca de 80 (hipótese).
- **Hoje falta.** Dizer quais são os 4 passos. Não pede fuso (o Hub mostra horas fixas de Brasília, `hub/status/status-page.tsx`).
- **Referência.** Uma plataforma de dados pede nome e fuso na entrada. Uma plataforma de agentes mostra o que vai ser criado antes de criar.
- **Princípios.** E4 em parte. E5 P. E7 P.

#### TB9. Passo 2, Ligue uma conta de modelo (`/welcome/model-account`)

- **Para que serve.** O Dono liga a conta de modelo da empresa. Atende A1, G1 e G4, que não andam sem modelo.
- **Conteúdo obrigatório.** "O Builder usa a conta da empresa para trabalhar. Ela fica em Configurações, Contas de modelo."; "Ligar conta" abre a folha com Chave de API ou Entrar com assinatura (`harness/model-accounts/link-account.tsx`, `key-form.tsx`); a conta dita em palavras (`link-account.tsx`); "Fazer depois" ou "Continuar" (`welcome/model-account.tsx`).
- **Ações.** Ligar conta; Fazer depois ou Continuar; Sair. O Dono.
- **Ação principal.** Ligar conta (`link-account.tsx`).
- **Estados.** Primeira vez; "Ligando…"; chave recusada no campo; esperando a assinatura; com conta.
- **Faixa de dados.** Uma conta (hipótese). Chave de 40 a cerca de 200 caracteres (hipótese).
- **Hoje falta.** Link para gerar a chave, custo, o que o Hub faz com a chave (o `KeyForm` diz, `key-form.tsx`; o passo não). A frase aponta para "Contas de modelo", que o mapa 6.4 parte em duas.
- **Referência.** Uma plataforma de agentes oferece criar o que falta e leva por link direto à geração do token.
- **Princípios.** E4 em parte. E5 P. E7 F (aponta para a página de dois donos).

#### TB10. Passo 3, Convide sua equipe (`/welcome/team`)

- **Para que serve.** O Dono convida as primeiras pessoas, cada uma com um papel. Atende `C6`.
- **Conteúdo obrigatório.** "Convidar pessoa"; E-mail; Papel (os que o servidor deixa, do menos privilegiado); "Enviar convite"; "Convite enviado para <e-mail>."; "Fazer depois" ou "Continuar"; "Voltar" (`hub/identity/welcome-team.tsx`, `invite-form.tsx`, `invite-fields.tsx`).
- **Ações.** Enviar convite; Continuar ou Fazer depois; Voltar; Sair. O Dono.
- **Ação principal.** Enviar convite.
- **Estados.** Vazio; "Enviando…"; já está na empresa, e-mail devolvido, papel não permitido (`invite-form.tsx`); "Muitos convites seguidos"; 100 convites abertos ou 100 pessoas (`packages/hub-api/src/capacity.ts`); com equipe.
- **Faixa de dados.** 1 a cerca de 10 convites no passo (hipótese); teto 100. Papéis, 4 de fábrica e os da empresa.
- **Hoje falta.** Título duplo; um convite por vez sem lista dos enviados; o papel sem o que permite.
- **Referência.** Nenhuma referência tem passo de equipe na entrada. O Better Auth tem um formulário de convite de membro.
- **Princípios.** E5 P. E6 F em parte. E7 F (dois títulos).

#### TB11. Passo 4, O que vamos construir primeiro? (`/welcome/build`)

**Decidido.** O passo 4 vira, no alvo, "Ligue seus sistemas" (que se pode pular) e um passo 5 "Começar a conversa"; o app deixa de ser o único fim. O alvo é JB5 em [as jornadas](../explanation/jornadas.md), construído com o item 6 do Brain. Até lá, o conserto pequeno é não oferecer só um app.

- **Para que serve.** O Dono pede o primeiro app; o pedido cria o Projeto e abre a conversa com o Builder. Atende A1.
- **Conteúdo obrigatório.** Caixa de pedido, modelo e esforço, "+", microfone, enviar; "Não cole senhas ou chaves na conversa."; 3 exemplos; "Ir para o início sem pedir nada"; ao enviar, o nome do Projeto e "Criar e começar" (`welcome/build.tsx`, `harness/room/start.tsx`). Sem conta de modelo, o aviso no lugar da caixa (`text.ts`).
- **Ações.** Enviar, escolher modelo, anexar, falar, usar um exemplo, Criar e começar, ir ao Início, Voltar, Sair. O Dono.
- **Ação principal.** Enviar o pedido.
- **Estados.** Vazio com exemplos; nomeando o Projeto; iniciando; modelo recusado abre a conversa com o motivo (`start.tsx`); sem conta; rascunho guardado (`start.tsx`).
- **Faixa de dados.** Pedido de uma linha a alguns parágrafos (hipótese). Nome do Projeto até 100 (`packages/hub-api/src/projects.ts`).
- **Hoje falta.** O passo só oferece um app como primeiro resultado. O alvo decidido (Entrada 1 a 3) está em JB5, [as jornadas](../explanation/jornadas.md).
- **Referência.** Uma plataforma de dados termina a entrada no "cérebro da empresa", com "Skip for now", e tem uma tela de preparo com a frase do que acontece.
- **Princípios.** E3 P. E4 P. E7 em parte ("Builder" no passo 2, "Assistente" no Início para a mesma caixa).

#### TB12. Cartão "Termine de preparar a empresa" (no Início)

**Decidido.** No alvo, o cartão ganha "Sistemas" e a região "Em aberto" (I1), como o cartão do PR 982.

- **Para que serve.** Devolver ao Dono ou Administrador o que ele pulou nos passos 2 e 3.
- **Conteúdo obrigatório.** Título; "Empresa: feito", "Conta de modelo: feito/falta", "Convidar equipe: feito/falta"; sem conta compartilhada, a frase de que só quem ligou a própria conversa; Continuar (`hub/identity/preparation-card.tsx`).
- **Ações.** Continuar, Dono e Administrador.
- **Ação principal.** Continuar.
- **Estados.** Some quando tudo está feito, enquanto carrega e se uma leitura falha. Não existe para os outros papéis.
- **Faixa de dados.** 3 marcas fixas.
- **Hoje falta.** Nada a apontar.
- **Referência.** Uma plataforma de agentes mostra "Setup 2/5" na página do projeto.
- **Princípios.** E5 P. E6 P.

### Configurações

A moldura: os grupos de hoje são dois, `Você` e o nome da empresa (`ui/settings-index.tsx`); o mapa 6.4 pede Você, e na empresa Geral, Pessoas e acesso, Modelos, e Avisos e uso (este nasce com o primeiro cartão). Só Papéis esconde a seção (`needs: 'manageRoles'`), e o Registro de dados, quando chegar, esconde do mesmo jeito (2026-11-21, `"D1 a D2 a"`); as outras desligam a ação e dizem quem pode. No celular o índice não aparece a 390 px. Tudo de "Você" mora na rota da empresa.

#### TB13. Minha conta (Você)

- **Para que serve.** A pessoa vê como aparece na empresa e diz ao Assistente quem ela é. G1 e `C4` pelo lado da pessoa.
- **Conteúdo obrigatório.** Perfil (Nome e E-mail, só leitura, `hub/identity/my-account.tsx`); Cargo e área com Salvar (`hub/identity/member-profile.tsx`); "O que o Conexus lembra de você", até 4.000 caracteres, Salvar e "Apagar tudo" com confirmação (`agents/assistant/profile-memory.tsx`).
- **Ações.** Salvar cargo e área, salvar e apagar a memória, só a própria pessoa. Mudar nome, e-mail, senha e sessões não existe.
- **Ação principal.** Não há uma só (três blocos com Salvar próprio). A camada de área decide.
- **Estados.** Vazio com "O Assistente ainda não guardou nada sobre você…" (`profile-memory.tsx`); esqueleto (`member-profile.tsx`); erro com Tentar de novo (`member-profile.tsx`, `profile-memory.tsx`); salvo sem confirmação (`profile-memory.tsx`).
- **Faixa de dados.** Memória de 0 a 4.000. Cargo e área até cerca de 60 (hipótese).
- **Hoje falta.** Segurança da conta (sem marco, mapa 6.2). A sessão de 30 min e 8 h não aparece (`auth.ts`). A memória "aprendida nas conversas" não diz de qual conversa nem quando.
- **Referência.** A demonstração do Better Auth lista sessões ativas, encerrar, passkeys e dois fatores. Outras referências tratam Segurança como seção própria.
- **Princípios.** E6 P. E7 em parte (a memória da pessoa e a da empresa ficam longe). E1 e E2 F (memória sem fonte nem data).

#### TB14. Suas contas de modelo (Você; página nova do mapa 6.4)

**Decidido.** E1 (b): a ordem das contas sai daqui e fica em Meus padrões; esta página fica só com as contas da pessoa.

- **Para que serve.** A pessoa liga contas próprias, ordena, pausa e vê em que ordem o Builder as tenta. G4 e A1 pelo custo da pessoa.
- **Conteúdo obrigatório.** "Suas contas"; "Ligar conta"; fila numerada por provedor com nome, origem ("chave …x7Qa"), estado em palavra (`harness/model-accounts/text.ts`) e menu com Subir, Descer, Renomear, Pausar ou Retomar, Remover (`account-menu.tsx`, linhas 62 a 93); "Nenhuma conta sua" (`my-accounts.tsx`). A linha "Sua ordem para <provedor>" sai daqui e vai para Meus padrões (E1 b).
- **Ações.** Todas, só a própria pessoa (`my-accounts.tsx`). Não há "Dar a pessoas…" para conta própria.
- **Ação principal.** Ligar conta.
- **Estados.** Vazio com botão preto; filas; recusada, "No limite até hh:mm", desligada pela Conexus.
- **Faixa de dados.** Nome da conta até 60 (`ACCOUNT_LABEL_MAX_LENGTH`). Contas por pessoa de 0 a cerca de 5; provedores de 1 a cerca de 4 (hipótese).
- **Hoje falta.** A página mistura dois donos; "Ligar conta" aparece duas vezes com o mesmo nome. A linha "Sua ordem" junta contas da pessoa e da empresa (`my-accounts.tsx`); pela E1 (b), ela mora em Meus padrões.
- **Referência.** Uma referência põe contas e padrão na mesma página, do mesmo dono. Outra guarda a chave pessoal na configuração da pessoa.
- **Princípios.** E1 em parte. E4 P. E5 P. E7 F hoje; P depois da divisão, com a ordem em Meus padrões (E1 b).

#### TB15. Meus padrões (Você)

**Decidido.** E1 (b): a ordem em que o Builder tenta as contas da pessoa mora aqui, com "Mudar a ordem".

- **Para que serve.** A pessoa escolhe o modelo e o raciocínio das suas conversas novas e vê por que começam ali. G1 e G3 pelo modelo.
- **Conteúdo obrigatório.** "Conversa nova" com "Só você. Onde as suas conversas novas começam, e por quê."; onde começa; "Você segue o padrão da empresa."; o aviso de conta indisponível; "Conta usada primeiro (<provedor>)" com "Mudar a ordem"; "Meu padrão" com seletor e "Salvar padrão" (`harness/model-accounts/my-defaults.tsx`).
- **Ações.** Escolher, Salvar padrão, Mudar a ordem, só a própria pessoa.
- **Ação principal.** Salvar padrão.
- **Estados.** "Escolha um modelo" com botão desligado; com padrão; sem conta para o provedor; sem conta nenhuma; erro do servidor.
- **Faixa de dados.** 1 modelo e 1 raciocínio; 3 a cerca de 15 modelos na lista (hipótese).
- **Hoje falta.** A cadeia pessoa, empresa, inicial em lista, não em prosa. Salvar é manual, enquanto Memória observacional salva ao escolher e Troca automática tem interruptor.
- **Referência.** Uma referência salva ao escolher o modelo. Outra põe "Preferências de conversa" ao lado dos modelos de linguagem.
- **Princípios.** E5 P. E6 P. E7 em parte (três modos de salvar).

#### TB16. Geral (Empresa: Geral)

- **Para que serve.** Ver o nome, o apelido e o endereço que os apps terão. A1 e A6.
- **Conteúdo obrigatório.** Nome com "Definido pela Central."; Apelido com "Entra no endereço de cada app da empresa e não muda."; exemplo de endereço (`hub/identity/company-general.tsx`).
- **Ações.** Nenhuma, para todos os papéis.
- **Ação principal.** Não há.
- **Estados.** Com dado. Sem apelido não acontece, porque o guarda manda à Primeira entrada (`enter-company.ts`).
- **Faixa de dados.** Apelido de 3 a 30. Nome até cerca de 80 (hipótese).
- **Hoje falta.** Identidade da empresa (cartão futuro, `A2`); fuso; logotipo. "Não muda" sem dizer por quê.
- **Referência.** Uma plataforma de dados mostra logotipo, nome editável, ID e Slug com uma frase cada, fuso, e por que não se apaga.
- **Princípios.** E6 P. E7 P. E5 F menor ("não muda" sem motivo).

#### TB17. Pessoas e convites (Empresa: Pessoas e acesso)

**Decidido.** E4 (a): "Quem usa os apps" fica, com o nível dito no título (todos os apps da empresa).

- **Para que serve.** Ver quem está na empresa, convidar, mudar papel, tirar; e ver quem de fora usa os apps. `C6`.
- **Conteúdo obrigatório.** Pessoas (nome, e-mail, papel, "cargo · área", "Cargo e área", "Mudar papel", "Tirar da empresa" ou "Sair da empresa", paginada, `hub/identity/people.tsx`); Convites pendentes com Reenviar e Cancelar; Convidar pessoa, ou "Só o dono ou um administrador convida pessoas."; Quem usa os apps, com "Tirar de todos" (`app-users.tsx`).
- **Ações.** Convidar, Reenviar, Cancelar, Mudar papel, Tirar, Tirar de todos, só quem gerencia (`people.tsx`). Sair da empresa, só a própria pessoa. Os outros leem.
- **Ação principal.** Enviar convite.
- **Estados.** Só o Dono e "Nenhum convite pendente."; lista paginada; "A empresa já tem 100 pessoas."; erros de convite no campo; leitura com a frase de quem pode; cada Tirar ou Mudar papel confirma com o efeito (`member-actions.tsx`).
- **Faixa de dados.** Pessoas de 1 a 100 e convites de 0 a 100 (`capacity.ts`). Típico 3 a cerca de 30 (hipótese, a primeira empresa do fundador).
- **Hoje falta.** Mudar papel só diz "Papel atual: X." (`member-actions.tsx`). Convidar fica embaixo da lista. "Quem usa os apps" é outro assunto e repete o "Quem usa o app" do Projeto. Sem última entrada por pessoa.
- **Referência.** Referências mostram, no seletor, o que cada papel pode e não pode; oferecem filtro por segundo fator, permissão em camadas e transferência da posse.
- **Princípios.** E4 em parte. E5 P. E6 P. E7 F (dois lugares para acesso a app).

#### TB18. Papéis (Empresa: Pessoas e acesso)

- **Para que serve.** Definir o que cada papel usa de cada conector, de que dados lê e se publica agente que escreve sozinho. `C6` e G7.
- **Conteúdo obrigatório.** Papéis de fábrica com frase e contagem; Papéis da empresa ("Sua empresa ainda não criou papéis."); "Novo papel". Um papel aberto: por conector, o que lê, escreve e apaga; "Publicar agente que escreve sozinho"; "Apagar papel" (`role-editor.tsx`).
- **Ações.** Tudo, só `manageRoles`. Para os outros a seção some e o endereço responde "não encontrado" (`settings/roles.tsx`).
- **Ação principal.** Novo papel na lista; Salvar dentro de um papel.
- **Estados.** Só os de fábrica; carregando; "Não deu para carregar os papéis."; nome em uso.
- **Faixa de dados.** 4 de fábrica; nome do papel de 1 a 40 (`company-roles.ts`). Papéis da empresa de 0 a cerca de 10; conectores por papel até 10 (hipótese, `D3`).
- **Hoje falta.** As frases dos papéis falam só de conectores e não do que o papel faz. O convite mostra só o nome do papel.
- **Referência.** Referências escolhem o papel ao dar a permissão e tratam papel e conjunto de permissões como dois objetos.
- **Princípios.** E4 P. E6 P. E7 em parte (o papel descrito de duas formas).

#### TB19. Contas da empresa e Troca automática (Empresa: Modelos; página nova do mapa 6.4)

- **Para que serve.** Ligar as contas da empresa, ordenar, reservar para pessoas, e trocar de modelo quando as contas acabam. G4 e A1.
- **Conteúdo obrigatório.** Contas da empresa: "Ligar conta"; a frase de quem pode; "Nenhuma conta ligada"; por provedor, "o Conexus e os agentes tentam nesta ordem"; por conta, lugar, nome, origem, "para todos" ou "reservada para X", estado, menu com "Dar a pessoas…" (`harness/model-accounts/company-accounts.tsx`, `account-menu.tsx`). Troca automática: a frase, o interruptor, a fila com Subir, Descer, Tirar, e "Adicionar à fila" (`model-fallback.tsx`); leitura para quem não gerencia (`company-accounts.tsx`).
- **Ações.** Todas, quem gerencia (`mayManage`). Os outros leem.
- **Ação principal.** Ligar conta.
- **Estados.** Vazio com a troca desligada; filas; recusada, pausada, no limite; versão que impede sobrescrever (`model-fallback.tsx`); leitura.
- **Faixa de dados.** Fila da troca de 0 a 50 (`MODEL_FALLBACK_MAX_LENGTH`, `model-accounts.ts`); nome até 60. Contas de 0 a cerca de 10 (hipótese).
- **Hoje falta.** Mora numa página com a conta da pessoa. A troca salva ao mexer (`model-fallback.tsx`) e Padrões da empresa usa botão.
- **Referência.** Uma referência põe contas e padrão numa página e limites de gasto em Uso. Outra põe o provedor de modelo em Integrações.
- **Princípios.** E1 em parte. E4 P. E5 P. E6 P. E7 F hoje, P depois da divisão.

#### TB20. Padrões da empresa (Empresa: Modelos)

- **Para que serve.** Escolher o modelo e o raciocínio de quem não escolheu nenhum. G1, G3 e G4 pelo padrão.
- **Conteúdo obrigatório.** "Conversa nova" ("Toda a empresa. Onde as conversas novas começam, e por quê."); "A empresa ainda não tem padrão."; "Padrão da empresa" com seletor e "Salvar padrão" (`harness/model-accounts/company-defaults.tsx`).
- **Ações.** Escolher e salvar, quem gerencia. Os outros leem.
- **Ação principal.** Salvar padrão.
- **Estados.** Sem padrão; com padrão; padrão sem conta; erro; seletor desligado com a frase de quem muda.
- **Faixa de dados.** 1 modelo e 1 raciocínio; 3 a cerca de 15 modelos (hipótese).
- **Hoje falta.** A consequência (quantos seguem o padrão). O botão cinza não diz por que está cinza.
- **Referência.** Uma referência diz a regra de precedência em uma frase e põe "Preferências de conversa" à parte.
- **Princípios.** E5 P. E6 P. E7 em parte (a precedência tem de aparecer aqui e em TB15).

#### TB21. Memória observacional (Empresa: Modelos)

**Decidido.** E2 (b): a escolha vai para um "Avançado" em Modelos, com o padrão "Automático".

- **Para que serve.** Escolher os modelos que resumem e condensam as conversas longas, o que decide custo e qualidade. G1 pelo custo; infraestrutura.
- **Conteúdo obrigatório.** "Observador" com a frase da regra; "Modelo do observador"; "Refletor" e "Modelo do refletor"; opções "Automático (o mais barato da conta)", "Segue o modelo da conversa" ou um modelo das contas da empresa (`harness/memory/settings.tsx`).
- **Ações.** Escolher cada modelo, quem gerencia. Os outros veem desligado com a frase.
- **Ação principal.** Não há uma só (dois seletores).
- **Estados.** Os dois em Automático; com escolha; desligado; "Não foi possível confirmar se o modelo foi salvo…". Salva ao escolher.
- **Faixa de dados.** 2 seletores; 2 opções fixas e 3 a cerca de 15 modelos (hipótese).
- **Hoje falta.** Observador e refletor são vocabulário de Mastra, sem explicação. "Memória" aparece em três nomes. Não mostra custo nem o que guardou. Decidido (E2 b): fica num "Avançado" em Modelos.
- **Referência.** A documentação do Mastra traz `'auto'` como padrão, com ajuste avançado. Uma plataforma de agentes trata a memória como parte do agente.
- **Princípios.** E5 P. E6 P. E7 F.

A Memória da empresa sai das Configurações e vai a Conhecimento (mapa 3.1 e 6.1). A ficha está em Dados e contexto (TD11). A Base só deixa de a listar.

#### O que vem nas Configurações (cartões, sem ficha)

A tela é hipótese, fora do repositório até o estudo do marco. O cartão e o marco vêm do mapa (6.2 e 6.4).

| Grupo | Cartão | Resultado | Marco | Referência mais próxima |
| --- | --- | --- | --- | --- |
| Empresa: Geral | Identidade da empresa | A4 | `A2`, "3B" | Página de identidade da organização |
| Empresa: Pessoas e acesso | Registro de dados, só Dono e Administrador | `C6` | Registro e conformidade, U9 | Registro de auditoria com filtros e exportação |
| Empresa: Pessoas e acesso | Chaves para agentes de fora | sem número (perto de G8) | `docs/steps/trilhas/dados.md` | Chaves de acesso e contas de serviço |
| Empresa: Modelos | Limites por provedor | G4, A1 | etapa 20, decisão 0058 | Limites de gasto por provedor |
| Integrações: a ligação | Os e-mails do aviso de cópia parada, por ligação (2026-11-23, "Por ligação, na janela") | `C1`, `C7` | o cartão do aviso, depois da etapa 2 do lago | o e-mail de falha no passo da agenda, por pipeline, do Databricks |
| Empresa: Avisos e uso | Uso | sem número | `D6` | Página de plano e uso |
| Empresa: Avisos e uso | Atividade | G9 | 21.1 | Registro de auditoria |
| Empresa: Avisos e uso | Plano e cobrança | sem número | etapa 23 | Página de plano e uso |

### Central

Quem não opera vê "não encontrado" (`routes/_app/operations/route.tsx`). O operador sem empresa cai na Central (`routes/_app/index.tsx`).

#### TB22. Clientes (`/operations/clients`)

- **Para que serve.** Ver as empresas cadastradas e em que ponto estão. Atende quem opera a instalação.
- **Conteúdo obrigatório.** "Clientes"; "Cadastrar cliente"; aviso de visita (`hub/operations/clients.tsx`); por linha, nome, razão social, CNPJ mascarado, estado em palavra e "Cadastrado em"; 50 por página.
- **Ações.** Cadastrar cliente; abrir um cliente. O operador.
- **Ação principal.** Cadastrar cliente.
- **Estados.** "Nenhum cliente cadastrado."; páginas de 50; erro; "não encontrado" sem permissão.
- **Faixa de dados.** 0 a cerca de 5 no começo, depois dezenas (hipótese, `docs/roadmap.md` resposta 4).
- **Hoje falta.** Busca, filtro por estado, última atividade, quantas pessoas e Projetos por cliente.
- **Referência.** Uma plataforma de agentes mostra estado em palavra, última atividade, busca e "Recently deleted" com "Restore".
- **Princípios.** E5 P. E1 em parte (data de cadastro, não de atividade). E7 P.

#### TB23. Cadastrar cliente (`/operations/clients/new`)

- **Para que serve.** Criar a empresa e convidar o administrador como primeiro Dono.
- **Conteúdo obrigatório.** CNPJ, Razão social, Nome de exibição, "E-mail do administrador", "Ele recebe um convite e entra como primeiro dono.", "Cadastrar cliente" (`hub/operations/register-client-form.tsx`); resposta que não fechou, guardada entre recargas.
- **Ações.** Cadastrar cliente, o operador.
- **Ação principal.** Cadastrar cliente.
- **Estados.** Vazio; "Cadastrando…"; CNPJ repetido; e-mail de operador; e-mail devolvido abre o cliente com o aviso.
- **Faixa de dados.** CNPJ de 14 dígitos; 4 campos; nomes até cerca de 80 a 120 (hipótese).
- **Hoje falta.** Não diz o que o cadastro cria nem o prazo do convite.
- **Referência.** Uma plataforma de agentes mostra um resumo antes de criar.
- **Princípios.** E4 em parte. E5 P.

#### TB24. Cliente (`/operations/clients/$companyId`)

- **Para que serve.** Acompanhar um cliente (dados, convite do Dono, pessoas, tipos de conta, lago de dados, exclusão).
- **Conteúdo obrigatório.** Nome e estado; dados; aguardando o Dono, "Corrigir dados" e o convite (Reenviar, Cancelar, "Convidar outro e-mail"); ativo, o mesmo bloco de Pessoas das Configurações (`hub/operations/client.tsx`) e Tipos de conta (`account-kinds.tsx`); aguardando ou ativo, o bloco Lago de dados (`lake.tsx`), com Criar o lago, Tentar de novo, Apagar o lago (pelo nome da empresa) e Tentar apagar de novo; Apagar cliente (`client.tsx`), que leva o banco e o lago.
- **Ações.** Todas, o operador.
- **Ação principal.** Aguardando o Dono, Reenviar o convite; ativo, nenhuma.
- **Estados.** Aguardando (pendente, vencido, recusado, cancelado); ativo; excluindo, retomável; não existe mais. O lago: sem lago, criando (pergunta de novo a cada 5 s), pronto, não deu para criar, apagando, não deu para apagar, e a leitura que falha, só no bloco.
- **Faixa de dados.** Pessoas de 1 a 100; tipos de conta 1 e mais N.
- **Hoje falta.** Não diz se o Dono abriu o e-mail nem em que passo da Primeira entrada está.
- **Referência.** Nenhuma.
- **Princípios.** E4 P. E7 em parte (o bloco de pessoas repetido).

#### TB25. Estado do Hub (`/operations/status`)

- **Para que serve.** Dizer se o Hub responde, a versão e os dois últimos inícios.
- **Conteúdo obrigatório.** "Estado do Hub", "Hub do Conexus no ar.", a versão, "Último início" e "Início anterior" em hora de Brasília, ou "Nenhum início gravado" (`hub/status/status-page.tsx`).
- **Ações.** Nenhuma.
- **Ação principal.** Não há.
- **Estados.** No ar; sem início gravado; erro; carregando.
- **Faixa de dados.** Uma frase, uma versão, duas datas.
- **Hoje falta.** De quando é a última checagem.
- **Referência.** Uma plataforma de agentes mostra painel de uso com limite.
- **Princípios.** E1 em parte. E5 P.

## 2. Dados e contexto

Papéis: só quem gerencia tem `manageConnections`, `manageCopies`, `manageRoles`; todo membro vê as tabelas que o papel lê (`seeData`).

#### TD1. Integrações (`integrations.index.tsx`)

- **Para que serve.** Ligar os sistemas e ver cada um funcionando ou parado. `C1` e a base de `C2`.
- **Conteúdo obrigatório.** Por sistema, logo, nome, categoria, contagem; por ligação, nome, "ligada por quem em que dia", conta, estado em palavra e hora do último teste (`hub/connectors/integrations.tsx`; `text.ts`); a lista do que ainda se liga, com a frase do que lê (`integrations.tsx`).
- **Ações.** Ligar, quem gerencia. Abrir, todos. Os outros veem "Só o dono ou um administrador liga, testa e desliga".
- **Ação principal.** Ligar.
- **Estados.** "Nenhuma integração ligada ainda." (`text.ts`); carregador da rota; erro com Tentar de novo (`integrations.index.tsx`); chaves recusadas ou conectar de novo (`text.ts`); ligação nova sem palavra. Sem paginação nem busca.
- **Faixa de dados.** Nome 1 a 60 (`packages/hub-api/src/connectors.ts`). Catálogo 3 hoje, 10 em `D3`. Ligações de 0 a 10, típico 1 a 3 (hipótese, `D3`).
- **Hoje falta.** O mesmo sistema em duas seções (`integrations.tsx`); resumo de saúde; o que a ligação entrega; busca e filtro; a coluna de conversas, que o mapa tira.
- **Referência.** Referências mostram coluna de capacidades e atividade, cinco estados com filtro e os registros por ligação.
- **Princípios.** E1 em parte. E5 P, salvo a ligação nova. E6 em parte (o botão some, `integrations.tsx`). E7 F (sistema em duas seções; "Ligar" com dois sentidos).

#### TD2. Integração, a página de uma ligação (`integrations.$connectionId.tsx`)

- **Para que serve.** Ver, testar e desligar uma ligação. `C1`.
- **Conteúdo obrigatório.** Voltar; logo, conector, categoria; nome; estado; quem ligou e quando, e conta (`hub/connectors/connection-page.tsx`); último teste e quem testou; conector e versão; Caderno com conceito, mapeamento e "provado em dia por quem, com N linhas" (`notes.tsx`); o porquê e o botão de conectar de novo.
- **Ações.** Testar, Desligar, Conectar de novo, apagar anotação, só quem gerencia. Os outros leem.
- **Ação principal.** Testar.
- **Estados.** Abre testando; erro com Tentar de novo; já desligada; testando, funcionando, chaves recusadas, 429, 5xx, resposta não entendida, app recusado (`text.ts`); Caderno vazio.
- **Faixa de dados.** Conceito até 120 e mapeamento até 500 (`connectors.ts`). Anotações e cópias por ligação, hipótese.
- **Hoje falta.** O que a ligação entrega, quais cópias e Projetos a usam, quando cada cópia rodou, histórico de testes (só o último fica).
- **Referência.** Referências mostram abas de execuções e atividade e os registros por ligação.
- **Princípios.** E1 F. E4 P (Desligar diz o que some, `unlink-dialog.tsx`). E5 P. E6 em parte. E7 P.

#### TD3. Ligar um sistema e Conectar de novo (janela)

- **Para que serve.** Ligar um sistema por chaves ou por login, e refazer uma ligação recusada. `C1`.
- **Conteúdo obrigatório.** "Ligar {sistema}" ou "Conectar de novo"; a descrição de cada fluxo; nome sugerido (`hub/connectors/link-dialog.tsx`); um campo por chave; "Antes de colar", onde achar cada campo.
- **Ações.** "Ligar e testar" ou "Continuar no {sistema}"; Cancelar. Quem gerencia.
- **Ação principal.** Ligar e testar.
- **Estados.** "Ligando…"; erro por campo; erro do Hub; resultado desconhecido; saída ao provedor.
- **Faixa de dados.** Nome 1 a 60; campos até `field.maxLength`.
- **Hoje falta.** O login pelo kit para quem cola chave (`D1`). Prévia do que a ligação vai ler. A janela não diz o que o Conexus vai ler (`text.ts`).
- **Referência.** Uma plataforma de agentes avisa que a chave gira. Plataformas de dados usam assistentes em passos.
- **Princípios.** E4 em parte. E5 P. E6 P. E7 P.

#### TD4. Retorno do login do provedor (`_app/integrations/return.tsx`)

- **Para que serve.** Terminar a autorização e levar à ligação nova. `C1`.
- **Conteúdo obrigatório.** "Voltando da autorização…"; na falha, o que houve, o que o provedor disse e "Voltar a Integrações" (`hub/connectors/sign-in-return.tsx`).
- **Ações.** Voltar a Integrações. A tela completa sozinha, uma vez.
- **Ação principal.** Nenhuma; no sucesso abre a ligação e testa.
- **Estados.** Carregando; sucesso; recusa; app recusado; provedor fora do ar; endereço inválido; erro do Hub.
- **Faixa de dados.** Mensagem do provedor até 1024 (`connectors.ts`).
- **Hoje falta.** Dizer qual conector está em curso; "tentar de novo" com o mesmo sistema.
- **Referência.** Nenhuma.
- **Princípios.** E4 P. E5 P.

#### TD5. Dados, o índice com a árvore (`data.index.tsx`)

- **Para que serve.** Ver o dado da empresa num catálogo. Desde a U14 do lago (cartão `a-primeira-copia-chega-ao-lago`) as cópias do banco da empresa saíram, e as tabelas do lago chegam na U9. `C2`, e o lugar de `C3` pela pasta Negócio.
- **Conteúdo obrigatório.** "Dados" e a frase do que é (`hub/copies/text.ts`); Bruto: quem gerencia vê cada sistema que as ligações da empresa ligam, com "Nenhuma tabela copiada" (`data-page.tsx`); quem não gerencia vê que o papel não lê tabela (`text.ts`). Negócio: "Nenhum conceito aprovado ainda" (`text.ts`). Apps: por Projeto, só leitura (`apps-layer.tsx`). Árvore com as três camadas (`data-tree.tsx`).
- **Ações.** Abrir cada camada, todo membro, no limite do papel.
- **Ação principal.** Nenhuma até a U9.
- **Estados.** "Nenhum sistema ligado ainda", com o caminho para Integrações; papel sem tabela (`text.ts`); esqueleto; erro de leitura com tentar de novo (`data-page.tsx`).
- **Faixa de dados.** Sistemas até 10 (hipótese).
- **Hoje falta.** As tabelas do lago e a busca sobre elas (U9); "Negócio 0" sem uso (`data-tree.tsx`).
- **Referência.** Plataformas de dados mostram fixados e recentes, caminho completo e abas.
- **Princípios.** E3 P. E4 P. E5 P.

#### TD6. A tabela (`data.$copyId.tsx`)

- **Para que serve.** Nenhum desde a U14 do lago: o endereço antigo de uma cópia leva à página Dados (TD5). A página de uma tabela do lago mora em `/data/lake/<id>` (U9).

#### TD8. Cópias, o endereço antigo (`copies.index.tsx`, `copies.$copyId.tsx`)

- **Para que serve.** Manter o endereço antigo, que leva a Dados (`copies.index.tsx`; `copies.$copyId.tsx`).
- **Conteúdo obrigatório.** Nenhum.
- **Ações.** Nenhuma.
- **Ação principal.** Não há.
- **Estados.** Redireciona para Dados, sem os parâmetros antigos.
- **Faixa de dados.** Não se aplica.
- **Hoje falta.** Nada.
- **Referência.** Nenhuma; a união é da resposta E1a (`docs/steps/trilhas/dados.md`).
- **Princípios.** E7 P.

#### TD9. Integrações do Projeto (`projects/$projectId_.integrations.tsx`)

- **Para que serve.** Dizer de quais ligações da empresa o app, o Builder e os agentes do Projeto podem ler. `C1`, A5, G4.
- **Conteúdo obrigatório.** "Integrações deste Projeto" (`text.ts`); por ligação, nome, estado, o que o Projeto faz com ela e conta (`hub/projects/project-integrations.tsx`); o remédio quando não funciona (`text.ts`).
- **Ações.** Liberar para ler e Tirar (ligação, com confirmação). Quem gerencia. Os outros veem "Peça ao dono ou a um administrador" (`project-integrations.tsx`).
- **Ação principal.** Liberar para ler.
- **Estados.** Esqueleto; empresa sem sistema; erro; não encontrado; ligação liberada e parada; "Tire a {nome} antes" (`text.ts`).
- **Faixa de dados.** Nome 1 a 60. Conectores 1 a 10 (hipótese).
- **Hoje falta.** O título sem o nome do Projeto. O Desenvolvedor não libera.
- **Referência.** Uma plataforma de agentes deixa a organização ligar e o projeto usar, com coluna de capacidades. Uma plataforma de dados faz o mesmo com os apps.
- **Princípios.** E1 em parte. E4 P. E5 P. E6 em parte (`project-integrations.tsx`). E7 F.

#### TD10. Dados do Projeto (`projects/$projectId_.data*.tsx`)

- **Para que serve.** Ver o que o app guarda e as cópias liberadas, só para ler. `C2`, A5.
- **Conteúdo obrigatório.** "Dados"; "Tabelas do app" e "Cópias liberadas" com contagem; ao abrir, colunas e linhas por página, "…" no texto cortado e "sem valor" no vazio (`hub/apps/data-rows.tsx`); contagem exata, "mais de 10.000" ou "indisponível" (`hub/apps/data.tsx`).
- **Ações.** Abrir e paginar, quem o Hub deixa ler (`projects/$projectId_.data.tsx`; `.data.copies.$table.tsx`). Nenhuma escreve.
- **Ação principal.** Abrir uma tabela.
- **Estados.** Sem app (`data.tsx`); app sem tabela (`data.tsx`); tabela vazia (`data-rows.tsx`); erro, e tabela larga demais; no celular, uma coisa por vez (`data-rows.tsx`).
- **Faixa de dados.** Linhas de 0 a "mais de 10.000". Tabelas do app de 0 a dezenas (hipótese).
- **Hoje falta.** De quando e de que sistema são as linhas da cópia (`data-rows.tsx`). Busca, filtro, ordem. A grade rola de lado. Título sem o nome do Projeto. Contagem "0" sem rótulo.
- **Referência.** Uma plataforma de dados mostra busca, filtro e tipo na coluna. Um explorador de banco fica fora do escopo (não é console de banco).
- **Princípios.** E1 F. E5 P. E6 em parte (404 sem explicação para quem monta). E7 F.

#### TD11. Conhecimento, hoje a Memória da empresa (`settings/company-memory.tsx`)

- **Para que serve.** Guardar como a empresa opera, em instruções e páginas que o Conexus segue. `C4` e G8. O mapa 3.1 a põe no trilho como Conhecimento.
- **Conteúdo obrigatório.** "Instruções da empresa" com contador e Salvar; "Páginas" com nome e "autor · dia" (`agents/assistant/company-memory-page.tsx`); a página aberta com texto, notas, "Editar", "Apagar a página", "Corrigir" e "Apagar" por nota; a frase de quem pode (`agents/assistant/text.ts`).
- **Ações.** Salvar, editar, apagar, corrigir, só Dono e Administrador. Abrir, todo membro. Não há botão para criar página nem nota; elas nascem do cartão do Assistente (`memory-proposal-card.tsx`).
- **Ação principal.** Salvar as instruções.
- **Estados.** "Nenhuma página guardada ainda." (`company-memory.tsx`); três esqueletos; erro com Tentar de novo; só leitura (`company-memory.tsx`); "A página mudou enquanto você salvava" (`company-memory-page.tsx`).
- **Faixa de dados.** Instruções de 0 a 2.000 (`packages/hub-api/src/company-memory.ts`); nome da página 1 a 200 e nota 1 a 1.000. Páginas, hipótese (uma referência cria 5 a 6 na primeira conversa).
- **Hoje falta.** O lugar no trilho; busca ou pasta; criar de mão; o estado "proposta" na lista; que agente seguiu a página.
- **Referência.** Plataformas de dados têm pastas, modelos, "+ New" e permissões, e uma conversa que semeia a memória. O Mastra mostra atividade por página.
- **Princípios.** E2 em parte (autor e dia, não quem aprovou). E3 F. E4 P. E6 em parte. E7 F (duas "Memórias"; lugar nas Configurações).

#### TD12. Conhecimento, o que vem (conceitos, propostas e o Mapa)

Hipótese, fora do repositório até o estudo do marco (etapa do Negócio, `D4`, o Brain).

- **Para que serve.** Mostrar os conceitos, cada um com tabela e prova, quem aprovou e quando; as propostas à espera; o Mapa. `C3`, `C4`, `C5`, `C7`, G2.
- **Conteúdo obrigatório.** Conceito com nome, significado, tabela, consulta que prova, quem aprovou e quando (mapa 3.1); a forma do conceito (decisão 0067); nomes e códigos, nunca valores (0064); propostas separadas dos fatos (0064 `B1`; 0065 `B1`); versão imutável (0064 `P1`); regra em palavras cita o conceito (0067).
- **Ações.** Propor, qualquer membro (0064 `Q1`). Aprovar, a primeira revisão do Dono e as seguintes com "Conceitos da empresa" (`L1`); quem propôs pode aprovar e a revisão guarda os dois (`R1`). Dispensar. No Mapa, navegar por ligação.
- **Ação principal.** Aprovar uma proposta.
- **Estados.** Todos hipótese. Primeira vez usa "Nenhum conceito aprovado ainda" (`hub/copies/text.ts`).
- **Faixa de dados.** Hipótese, sem medida.
- **Hoje falta.** A tela. Hoje há a pasta Negócio vazia e o Caderno de cada ligação (`notes.tsx`), que 0064 manda virar propostas.
- **Referência.** Plataformas de dados aceitam item por item. O Mastra e outras referências mostram um grafo de conhecimento.
- **Princípios.** E2 é a razão da tela; E1, E3, E4 e E7 se aplicam. Nada se mede hoje.

## 3. Agentes

Papéis: `manageAgents` e `manageAutomations` valem para todo papel que não é Membro; `publishUnattendedWrite` só para Dono e Administrador. O Membro não vê Agentes nem Automações (`hub/projects/project-rail.tsx`). O que a conversa com mensagens mostra vem do código.

#### TG1. Início (`_app/companies/$companyId/index.tsx`)

- **Para que serve.** Ser a porta, para perguntar à empresa e retomar o que estava em curso. G1, G3, G4.
- **Conteúdo obrigatório.** Saudação; caixa com "+", Projeto, ferramentas, modelo e esforço, microfone, enviar; "Não cole senhas ou chaves na conversa"; três exemplos (`agents/assistant/text.ts`); "Continuar" com 5 conversas; "Projetos" e "Ligações"; o cartão de preparação para quem convida (`index.tsx`) (`agents/assistant/home.tsx`, `day.tsx`).
- **Ações.** Enviar e anexar, quem tem conta de modelo. Abrir conversa, Projeto ou ligação, todos. Cartão de preparação, Dono e Administrador. Quem cria Projeto: em aberto.
- **Ação principal.** Enviar a pergunta.
- **Estados.** "Nenhuma conversa ainda." (`day.tsx`) e "Ligue um sistema em Integrações." (`agents/assistant/text.ts`); esqueletos (`day.tsx`); erro por bloco; sem conta de modelo (`home.tsx`); corta em 5 (`ui/block.tsx`).
- **Faixa de dados.** Título até 120 (`packages/hub-api/src/assistant.ts`); nome de Projeto até 100; até 20 arquivos, cerca de 10,5 MB cada (`harness/room/attachments.ts`). Volumes, hipótese.
- **Hoje falta.** Títulos que distingam conversas; fonte e hora na resposta (`D2`); o Supervisor (`A6`). A coluna repete "Continuar".
- **Referência.** Uma referência permite favoritar, arquivar e rotular. Uma plataforma de agentes dá título com sentido.
- **Princípios.** E3 em parte. E6 P. E7 F (duas listas de conversas; seletor de Projeto repetido).

#### TG2. Conversa da empresa (`conversations/$conversationId.tsx`)

- **Para que serve.** Receber a resposta e agir sobre ela (analisar, ver o arquivo, aprovar, criar). G1, G3, G7, `C5`.
- **Conteúdo obrigatório.** Título e selo "Automação" (`agents/assistant/conversation.tsx`); transcrição com linhas de ferramenta agrupadas (`text.ts`); bloco de fontes com sistema e estado em palavra (`harness/room/sources.tsx`); "Conexus trabalhando" e tarefas; estado da memória; caixa; arquivo ao lado (`conversation.tsx`); cartões de app, automação, memória, "Aprovar?" (`approval-text.ts`), pergunta e plano.
- **Ações.** Enviar, orientar, parar, trocar modelo, quem tem conta. Aprovar ou recusar, a pessoa que conversa. Criar automação, todo papel menos o Membro (`proposal.tsx`). Salvar na memória, só Dono e Administrador. Renomear e apagar só na coluna (`conversation-row.tsx`).
- **Ação principal.** Enviar a próxima mensagem.
- **Estados.** Vazio; trabalhando; esperando uma pessoa trava a caixa (`chat.tsx`); mensagens anteriores; envio não confirmado (`harness/room/text.ts`); escrita recusada (`text.ts`); sem conta (`chat.tsx`); não encontrada (`chat.tsx`).
- **Faixa de dados.** Leitura com teto de 10.000 linhas (`packages/hub-api/src/app-data.ts`). Mensagens, hipótese.
- **Hoje falta.** Ver uma conversa real; o que a conversa mostra com mensagens vem do código. O erro cai num `NotFound` genérico.
- **Referência.** Uma plataforma de agentes mostra o resultado do evento do agente. Uma plataforma de dados baixa a tabela e avalia a resposta. Outra mostra a sessão do agente gerenciado.
- **Princípios.** E1, E4 e E5 P no código. E3 P (`proposal.tsx`). E6 em parte (sem botão desligado).

#### TG3. Coluna de conversas (só no Início)

- **Para que serve.** Achar e retomar uma conversa. G1 e E3.
- **Conteúdo obrigatório.** "Nova conversa"; busca; filtro por lugar; abas Recentes e Projetos; grupos por dia; título, Projeto e idade por linha; "Ver todas" (`agents/assistant/sidebar-conversations.tsx`).
- **Ações.** Abrir, buscar, filtrar, quem tem conta. Renomear e apagar, a dona; apagar confirma (`text.ts`).
- **Ação principal.** Abrir a conversa.
- **Estados.** Só "Nova conversa"; esqueletos; erro; busca e filtro sem resultado; 30 por página.
- **Faixa de dados.** 30 por página; busca até 100 (`packages/hub-api/src/assistant.ts`).
- **Hoje falta.** Favoritar, arquivar, ordenar; estado de conversa rodando ou falha na linha. Aparece fora do Início.
- **Referência.** Referências oferecem filtros e facetas de conversa e a sessão do agente gerenciado.
- **Princípios.** E5 em parte. E7 F.

#### TG4. Agentes da empresa (`agents.index.tsx`)

- **Para que serve.** Ver os agentes de todos os Projetos e criar um novo. G4, G9 em parte.
- **Conteúdo obrigatório.** "Agentes" e "Novo agente"; filtro por Projeto; por linha, nome, Projeto, "Nunca rodou" ou "Rodou há 3 h", estado em palavra (`agents/saved-agent/agent-list.tsx`; `rows.tsx`).
- **Ações.** Abrir; filtrar; Novo agente pergunta o Projeto e leva ao Construtor (`new-agent.tsx`). Não-Membro. Para o Membro, não encontrada (`agents.index.tsx`).
- **Ação principal.** Novo agente.
- **Estados.** "Nenhum agente ainda. Os agentes nascem num Projeto." com o botão à vista; filtro vazio; esqueleto; erro (`agents.index.tsx`); sem Projeto (`text.ts`).
- **Faixa de dados.** Nome até 80, descrição até 280 (`packages/hub-api/src/agents.ts`). Sem paginação. Volume, hipótese.
- **Hoje falta.** Descrição e ferramentas (só a lista do Projeto tem); quem criou; resultado da última execução. A coluna de conversas.
- **Referência.** Uma referência lista agentes. O Mastra tem busca e vazio próprio.
- **Princípios.** E3 P. E5 P. E6 P. E7 em parte. E1 F.

#### TG5. Automações da empresa (`automations.index.tsx`)

- **Para que serve.** Ver e controlar as automações por horário. G5.
- **Conteúdo obrigatório.** "Automações"; por linha, nome, "Ativa" ou "Pausada", horário em palavras, "Próxima", lugar, sistemas lidos; Rodar agora, Pausar ou Retomar, Apagar (`agents/assistant/automations/automations.tsx`; `cadence-text.ts`).
- **Ações.** Rodar agora (`text.ts`), pausar, retomar, apagar com aviso (`automations.tsx`), abrir, todo papel menos o Membro, cada um as suas (`automations.index.tsx`).
- **Ação principal.** Abrir o histórico da automação. Hoje três botões de peso igual.
- **Estados.** "Peça numa conversa…" com "Nova conversa" (`text.ts`); esqueleto; erro; pausada; ação em curso (`automations.tsx`); não confirmada (`text.ts`).
- **Faixa de dados.** Nome até 80, instrução até 4000 (`packages/hub-api/src/automations.ts`); 4 cadências. Sem paginação.
- **Hoje falta.** A última execução; criar e editar por tela; ligar e desligar num gesto.
- **Referência.** Uma referência mostra a automação com histórico e a criação de nova. O Mastra tem lista de agendas com a última execução.
- **Princípios.** E3 em parte. E5 P. E6 P. E4 em aberto.

#### TG6. Automação, execuções (`automations.$automationId.tsx`)

- **Para que serve.** Ver o que a automação faz e o que já rodou. G5, G9 em parte.
- **Conteúdo obrigatório.** Voltar; nome e estado; horário, próxima, lugar, sistemas; a instrução inteira; as três ações; histórico com dia e hora, "Horário" ou "Manual", resultado, "Abrir a conversa"; paginação (`agents/assistant/automations/runs.tsx`).
- **Ações.** As de TG5 e Abrir a conversa. Fora do lugar, não encontrada (`automations.$automationId.tsx`).
- **Ação principal.** Abrir a conversa da última execução.
- **Estados.** "Ainda não rodou."; rodando, pronta, falhou, não rodou; paginação; acompanhamento ao vivo (`automations.tsx`).
- **Faixa de dados.** Cerca de 30 execuções por mês numa diária (conta do código). Tamanho da página: em aberto.
- **Hoje falta.** O que a execução leu ou escreveu sem abrir a conversa; filtro por estado.
- **Referência.** O Mastra tem lista de agendas. Referências mostram linha do tempo da sessão e monitor.
- **Princípios.** E3 P. E5 P. E1 F.

#### TG7. Conversas do Projeto (`$projectId_.assistant.index.tsx`)

- **Para que serve.** Conversar com o Assistente no Projeto e retomar as conversas dele. G1, G3.
- **Conteúdo obrigatório.** "Conversas"; a caixa com o Projeto fixo e as ligações liberadas, ou "Liberar um sistema em Integrações do Projeto" (`agents/assistant/text.ts`); lista das conversas da pessoa (`home.tsx`); paginação (`agents/assistant/project.tsx`).
- **Ações.** Enviar, abrir e paginar, todo papel (`project.tsx`).
- **Ação principal.** Enviar a pergunta.
- **Estados.** "Nenhuma conversa neste Projeto ainda."; esqueleto (`home.tsx`); erro; sem conta; sem ligação; não encontrado.
- **Faixa de dados.** Título até 120. Volume, hipótese.
- **Hoje falta.** O título com o Projeto; distinguir conversas; buscar e filtrar.
- **Referência.** Referências mostram explorador, monitor de conversas e facetas de filtro.
- **Princípios.** E3 em parte. E6 P. E7 F.

#### TG8. Conversa do Assistente no Projeto (`$projectId_.assistant.$conversationId.tsx`)

- **Para que serve.** A conversa de TG2, no endereço do Projeto.
- **Conteúdo obrigatório.** O de TG2, com a barra das ligações liberadas (`$projectId_.assistant.$conversationId.tsx`).
- **Ações.** As de TG2.
- **Ação principal.** Enviar a próxima mensagem.
- **Estados.** Os de TG2; sob outro Projeto, "Esta conversa não existe mais." (`agents/assistant/text.ts`).
- **Faixa de dados.** A de TG2.
- **Hoje falta.** Em aberto.
- **Referência.** As de TG2.
- **Princípios.** Os de TG2. E7 F ("Conversas" e "Início" para o mesmo tipo de tela).

#### TG9. Agentes do Projeto (`$projectId_.agents.index.tsx`)

- **Para que serve.** Pedir um agente ao Construtor e ver os agentes do Projeto. G4.
- **Conteúdo obrigatório.** "Agentes" e as abas Agentes e Ferramentas; "Conte o que você quer que um agente faça."; caixa "Peça ao Conexus um agente…" com dois exemplos; aviso de senhas; Agentes com descrição, ferramentas e estado (`agent-list.tsx`); Conversas com o Construtor (`agents/saved-agent/area.tsx`).
- **Ações.** Pedir ao Construtor, abrir agente ou conversa, trocar de aba, todo papel menos o Membro (`text.ts`).
- **Ação principal.** Pedir ao Construtor.
- **Estados.** Dois vazios; três esqueletos (`route-states.tsx`); erro; sem conta (`area.tsx`); criação não confirmada (`area.tsx`).
- **Faixa de dados.** Volumes, hipótese. Sem paginação.
- **Hoje falta.** O título com o Projeto; saber pela lista se o agente rodou e como.
- **Referência.** Uma referência lista agentes. O Mastra tem lista de exemplos e criação de agente.
- **Princípios.** E3 P. E5 P. E6 P. E7 F.

#### TG10. Agente (`$projectId_.agents.$agentId.tsx`)

- **Para que serve.** Configurar, testar e publicar um agente. G4, G7.
- **Conteúdo obrigatório.** Voltar, nome, estado; "Testar", "Publicar vN", "Apagar"; Instruções, Modelo, Memória, Ferramentas, Ligações (cada escrita com "Pergunta antes" ou "Faz sozinho"), Versões; painel de teste (`agents/saved-agent/agent-page.tsx`, `config-panel.tsx`, `connections-section.tsx`, `write-lines.tsx`, `versions.tsx`, `test-panel.tsx`).
- **Ações.** Editar, testar, publicar, voltar versão, apagar, todo papel menos o Membro. "Faz sozinho", só Dono e Administrador; para os outros fica desligado com a frase (`write-lines.tsx`). "Fora do seu papel" (`text.ts`). Apagar avisa conversas e automações (`text.ts`).
- **Ação principal.** Publicar.
- **Estados.** Vazio (`text.ts`); esqueleto que não é o desenho (`route-states.tsx`); grava ao sair do campo, sem "Salvo" (`config-panel.tsx`); recusa por campo (`text.ts`); ferramenta com versão nova; rascunho com mudanças; apagado (`text.ts`); no telefone, duas abas.
- **Faixa de dados.** Nome até 80, instruções até 8000, descrição até 280 (`packages/hub-api/src/agents.ts`); mensagem da versão até 280 (`publish.tsx`).
- **Hoje falta.** Resumo do agente em uma frase; exemplo de instruções; de onde lê e com que papel; quem pode usá-lo; o que fez (G9). "Testar" e "Publicar v1" com o mesmo peso.
- **Referência.** Uma plataforma de agentes tem painel de configuração do agente. O Mastra tem indicador de salvamento automático, avisos de impacto e seletor de visibilidade. Uma plataforma de dados lista MCPs.
- **Princípios.** E4 P. E5 em parte (salvar silencioso). E6 P. E7 em parte. E1 F.

#### TG11. Conversa do agente (`$projectId_.agents.$agentId.$conversationId.tsx`)

- **Para que serve.** Testar o rascunho ou conversar com a versão publicada. G4.
- **Conteúdo obrigatório.** A casca de TG2 no painel; "Conversa de teste com o rascunho"; "Pergunte a {nome}…"; "· Teste" na lista (`agents/saved-agent/agent-chat.tsx`, `text.ts`).
- **Ações.** As de TG2, "Nova conversa" (com versão publicada) e "Testar rascunho". Papéis de TG10. Onde o Membro usa um agente publicado, o repositório não mostra.
- **Ação principal.** Enviar a mensagem de teste.
- **Estados.** "Ainda não há conversas com este agente."; rascunho ou versão pela faixa; conversa sumida; os de TG2.
- **Faixa de dados.** A de TG2.
- **Hoje falta.** O que o agente leu e escreveu, no painel de teste; se o dado é ao vivo ou copiado.
- **Referência.** Referências mostram linha do tempo da sessão e abas Chat e Traces.
- **Princípios.** E4 P pela casca. E5 P. E1 em aberto.

#### TG12. Ferramentas (`$projectId_.agents.tools.tsx`)

- **Para que serve.** Ver a biblioteca de ferramentas do Projeto. G4.
- **Conteúdo obrigatório.** "Agentes", abas, tabela com Ferramenta, "Lê de", Efeito, "Usada por", Versão, Ações (`agents/saved-agent/tools/tools-tab.tsx`).
- **Ações.** Abrir, nova versão, apagar com aviso de quem usa (`agents/saved-agent/tools/text.ts`). Não-Membro.
- **Ação principal.** Abrir a ferramenta.
- **Estados.** "Nenhuma ferramenta ainda. O Construtor faz as primeiras…"; esqueleto; erro; apagar em uso recusa.
- **Faixa de dados.** Hipótese; limite do nome em aberto.
- **Hoje falta.** Criar sem o Construtor (o "Criar" só existe na página do agente).
- **Referência.** Uma plataforma de dados lista MCPs. Uma plataforma de agentes mostra o painel de configuração do agente.
- **Princípios.** E3 em parte. E4 P (coluna Efeito). E7 F.

#### TG13. Ferramenta (`$projectId_.agents.tools_.$toolId.tsx`)

- **Para que serve.** Ver as versões de uma ferramenta e gravar uma nova. G4.
- **Conteúdo obrigatório.** "Voltar às ferramentas"; nome e "Em código"; "Nova versão"; versões com número, descrição, valores fixos e o que o modelo preenche; resultado do teste (`agents/saved-agent/tools/tool-page.tsx`; `agents/saved-agent/tools/text.ts`).
- **Ações.** Nova versão; ferramenta em código só o Construtor muda (`agents/saved-agent/text.ts`). Papéis de TG12.
- **Ação principal.** Nova versão.
- **Estados.** Esqueleto; erro; versão mais nova pede "Recarregar"; recusa por campo.
- **Faixa de dados.** Hipótese.
- **Hoje falta.** Valores fixos como JSON cru (`tool-page.tsx`). Quais agentes usam cada versão (só no comentário).
- **Referência.** O Mastra tem avisos de impacto do agente. Outra referência tem visualizador de ferramenta personalizada.
- **Princípios.** E5 P. E7 F. E4 em aberto.

#### TG14. Conversa com o Construtor (`$projectId_.agents.construtor.$conversationId.tsx`)

- **Para que serve.** Montar um agente conversando e ver o rascunho crescer. G4.
- **Conteúdo obrigatório.** "Voltar para Agentes" e título; a casca de TG2 com "Peça ao Conexus um agente…"; painel do rascunho com nome, estado, Instruções, Modelo, Memória, Ferramentas, Ligações, e "Testar", "Abrir a página", "Publicar vN" (`agents/agent-builder/construtor-chat.tsx`, `draft-panel.tsx`).
- **Ações.** Conversar, parar, trocar modelo, testar, abrir, publicar. Quem monta.
- **Ação principal.** Enviar a mensagem ao Construtor.
- **Estados.** "Conte o que você quer que um agente faça."; sem painel antes do agente; apagado; "O rascunho mudou. Abra o agente para ver."; erro por campo; não encontrada.
- **Faixa de dados.** A de TG10.
- **Hoje falta.** "Publicar" do painel vai sem mensagem de versão (`draft-panel.tsx`), a página pede (`publish.tsx`).
- **Referência.** O Mastra tem edição de agente, indicador de salvamento automático, seletor de visibilidade e ferramenta de enviar plano.
- **Princípios.** E3 P. E5 P. E4 F.

#### TG15. Automações do Projeto (`$projectId_.automations.index.tsx`)

- **Para que serve.** TG5 com o Projeto fixo.
- **Conteúdo obrigatório.** O de TG5; a linha ainda escreve o Projeto (`automations.tsx`).
- **Ações.** As de TG5. Não-Membro.
- **Ação principal.** Abrir o histórico.
- **Estados.** Os de TG5; "Nova conversa" leva às Conversas do Projeto (`automations.tsx`).
- **Faixa de dados.** A de TG5.
- **Hoje falta.** O título com o Projeto; o lugar repetido em cada linha.
- **Referência.** As de TG5.
- **Princípios.** E7 F; os demais de TG5.

#### TG16. Automação do Projeto, execuções (`$projectId_.automations.$automationId.tsx`)

- **Para que serve.** TG6 dentro do Projeto.
- **Conteúdo obrigatório.** O de TG6; voltar leva às Automações do Projeto.
- **Ações.** As de TG6; de outro lugar, não encontrada.
- **Ação principal.** Abrir a conversa da última execução.
- **Estados.** Os de TG6.
- **Faixa de dados.** A de TG6.
- **Hoje falta.** As de TG6.
- **Referência.** As de TG6.
- **Princípios.** Os de TG6.

## 4. Apps

#### TA1. Todos os projetos (`projects/index.tsx`)

- **Para que serve.** Achar um Projeto e abri-lo, ou começar um novo. A1 e E3.
- **Conteúdo obrigatório.** "Todos os projetos"; a frase do que é um Projeto (`hub/projects/project-state.ts`, hoje curta, porque o mapa inclui agentes e automações); por Projeto, nome, estado do app em uma palavra (`project-state.ts`), dia de criação (`project-cards.tsx`). Falta com fonte: dono, última mudança, busca, filtro, ordem, pedido de publicação aberto, a página e o filtro no endereço (web W18).
- **Ações.** Novo projeto, todo membro (`projects.tsx`). Abrir (o cartão é o link, `project-cards.tsx`). Paginar.
- **Ação principal.** Novo projeto. Hoje é um botão `ghost` (`new-project-dialog.tsx`).
- **Estados.** "Nenhum projeto ainda" com "Novo projeto" duas vezes; lista em branco sem esqueleto; 50 por página (`packages/hub-api/src/companies.ts`); erro sem ação; "Projeto apagado." (`projects.tsx`).
- **Faixa de dados.** Nome 1 a 100 (`packages/hub-api/src/projects.ts`); até 50 por página. Volume típico, hipótese (2 no inventário).
- **Hoje falta.** O que está em "Falta com fonte"; a coluna de conversas; duas grafias, "projeto" e "Projeto".
- **Referência.** Referências têm lista de projetos com estados vazios, lista de apps e painel de visão geral.
- **Princípios.** E1 com ressalva. E3 F. E5 P. E7 F.

#### TA2. Novo projeto (diálogo)

- **Para que serve.** Criar o Projeto que vai guardar uma conversa e um app. A1.
- **Conteúdo obrigatório.** "Novo projeto"; "Nome do projeto" (`packages/hub-api/src/projects.ts`); o endereço do app ao digitar (`hub/projects/name-step.tsx`); criar e cancelar.
- **Ações.** Criar, todo membro; Cancelar; Tentar de novo; Abrir o Projeto se a abertura falhou.
- **Ação principal.** Criar projeto.
- **Estados.** "Preparando o banco da empresa…" no primeiro; "Criando…"; nome ou endereço repetido; falha sem confirmação.
- **Faixa de dados.** Nome 1 a 100. Máximo do endereço: em aberto.
- **Hoje falta.** "Um Projeto precisa só de um nome, por enquanto." promete um passo que não existe (`new-project-dialog.tsx`).
- **Referência.** Uma plataforma de agentes mostra um resumo antes de criar. Uma plataforma de dados usa assistente em passos.
- **Princípios.** E4 em parte. E5 P. E7 F.

#### TA3. A moldura do Projeto (coluna e menu)

- **Para que serve.** Dizer em qual Projeto a pessoa está e levá-la a cada parte. E6, E7.
- **Conteúdo obrigatório.** Marca e nome do Projeto na mesma linha (mapa 5.3); seletor com 5 recentes e "Todos os projetos" (`hub/projects/project-rail.tsx`); os oito itens na ordem do mapa 5; coluna perto de 240 px, botão de recolher à vista, ícones quando recolhida, estado guardado (mapa 5.3); nada "em breve".
- **Ações.** Ir a cada parte, trocar de Projeto, recolher. Agentes e Automações com `manageAgents` e `manageAutomations`; Dados com `viewAppData` (`project-rail.tsx`).
- **Ação principal.** Ir à parte escolhida.
- **Estados.** Nome em esqueleto; falha vira "Projeto"; Projeto inexistente mostra o menu inteiro; recolhida; celular.
- **Faixa de dados.** Nome 1 a 100, cortado (`ui/sidebar-selector.tsx`); 8 itens; 5 recentes.
- **Hoje falta.** A ordem do código difere da do mapa (`project-rail.tsx`). Coluna de 272 px que some ao recolher. No celular a gaveta não traz os itens do Projeto.
- **Referência.** Referências têm seção de detalhe do app com menu lateral; a organização liga e o projeto usa.
- **Princípios.** E6 F no celular e no Projeto inexistente. E7 F.

#### TA4. Construir (`projects/$projectId.tsx`)

- **Para que serve.** Pedir o app em conversa, ver o que o Builder montou e publicar. A1; A2, A3 e A8 vão aqui; A7 pelas abas.
- **Conteúdo obrigatório.** Abas Prévia, Código e Alterações (W31; hoje duas, `hub/projects/area.tsx`); versão de agora e se está publicada; "Versão ▾" (W31); Abrir app (`area.tsx`); Publicar ou Pedir para publicar (`area.tsx`); aviso da última falha; "Pedido de publicação" (`hub/requests/request-line.tsx`); a Conversa ao lado, com a faixa que se arrasta (`agents/app-builder/workbench.tsx`); no celular, App ou Conversa. Plano e conferência: hipótese, fora do repositório até o estudo do marco.
- **Ações.** Abas, tamanho da Prévia, Abrir app, todos. Publicar, só Dono e Administrador. Pedir para publicar, os demais (`publish.tsx`). Cancelar pedido, Recusar, Publicar a versão N. Conversar, todo papel.
- **Ação principal.** Duas áreas, uma por área (enviar na conversa, Publicar na linha de cima). Qual domina é escolha em aberto.
- **Estados.** "Ainda não há uma prévia disponível…" (`agents/app-builder/preview/stage.tsx`); etiqueta de versão (`area.tsx`); Projeto não encontrado; Prévia recusada (`preview.tsx`); pedido aberto; Safari (`preview.tsx`).
- **Faixa de dados.** Nome até 100 (`workbench.tsx`). Versões sem medida.
- **Hoje falta.** Alterações e "Versão ▾"; o nome do Projeto como título (só para leitor de tela, `area.tsx`).
- **Referência.** Uma plataforma de agentes mostra estado, Setup, Atividade e deploys recentes. Uma plataforma de aplicativos tem o botão de compartilhar e as mensagens de publicação.
- **Princípios.** E3 P. E4 em parte (Publicar não diz a quem, `publish.tsx`). E5 P. E6 P. E7 F.

#### TA5. Conversa do Builder (`projects/$projectId.conversations.$conversationId.tsx`)

Rota de Apps, não de Agentes. **Ficha incompleta:** os campos "em aberto" entram no estudo da área Apps (A1 a A3), e ela não conta entre as fichas completas.

- **Para que serve.** A conversa de Construir, onde se pede o app. A1.
- **Conteúdo obrigatório.** A casca `Chat` comum (`chat.tsx`), o seletor de conversas no topo (`ConversationSwitch`) e o botão de modelo (`agents/app-builder/panel.tsx`, com `BUILDER_CONTROLLER`).
- **Ações.** Em aberto além da casca.
- **Ação principal.** Enviar a mensagem.
- **Estados.** Em aberto; vazio "Descreva o aplicativo que você quer criar.".
- **Faixa de dados.** Em aberto.
- **Hoje falta.** Um estudo próprio desta rota.
- **Referência.** Em aberto.
- **Princípios.** Em aberto.

#### TA6. Prévia (aba de Construir)

- **Para que serve.** Ver e usar o app da versão de agora, como quem o abre. A1, E5.
- **Conteúdo obrigatório.** Janela de navegador com Recarregar, cadeado, endereço e "versão N" (`agents/app-builder/preview/preview.tsx`); Computador ou Celular; o app isolado; aviso do Safari guardado na sessão.
- **Ações.** Recarregar; tamanho (`?view=`); abrir em outra aba no celular com versão publicada; fechar o aviso.
- **Ação principal.** Usar o app na moldura.
- **Estados.** Tela de início; carregando sem indicador; passe recusado; versão de agora diferente da publicada; Safari.
- **Faixa de dados.** Endereço cortado com reticências.
- **Hoje falta.** No celular a versão e se está publicada somem (`area.tsx`, `preview.tsx`).
- **Referência.** Uma plataforma de agentes mostra "Deployed 8m ago". Uma plataforma de aplicativos tem as mensagens de prévia.
- **Princípios.** E1 F no celular. E4 P. E5 P no computador.

#### TA7. Código (aba de Construir)

- **Para que serve.** Ler os arquivos da versão guardada. A7.
- **Conteúdo obrigatório.** "Versão N, guardada em <dia e hora>" (`agents/app-builder/source/source.tsx`); árvore; arquivo com caminho e cor; "Arquivos" no celular.
- **Ações.** Escolher um arquivo. Sem copiar, baixar, procurar ou trocar de versão.
- **Ação principal.** Escolher um arquivo.
- **Estados.** "Nenhuma versão guardada ainda. Peça um app na Conversa."; `Loading`; erro com Tentar de novo; erro de arquivo sem repetir; "Este app ainda está vazio".
- **Faixa de dados.** Árvore de 256 px. Arquivos sem medida.
- **Hoje falta.** Ver outra versão e a diferença.
- **Referência.** Uma plataforma de agentes mostra o código por deploy.
- **Princípios.** E1 P. E3 em parte. E5 P.

#### TA8. Alterações (nova, A7)

Hipótese, fora do repositório até o estudo do marco. As fontes são web W31 (`docs/guides/web.md`), aprovação e20 (`docs/approvals/e20-app-com-dados.md`), `docs/reference/builder-prompt.md`, aprovação e141 (`docs/approvals/e141-a-previa.md`).

- **Para que serve.** Quem programa vê o que o Builder mudou. A7.
- **Conteúdo obrigatório.** A diferença entre a versão de agora e a publicada; de cada versão, quem enviou e quando (`packages/hub-api/src/apps.ts`).
- **Ações.** Ler. "Pedir ao Builder para corrigir" ficou fora (e141).
- **Ação principal.** Ler a diferença.
- **Estados.** Uma só versão, nada a comparar (hipótese); nada mudou (hipótese); os outros como TA7.
- **Faixa de dados.** Sem fonte.
- **Hoje falta.** Não existe, e por W31 não deve aparecer antes da etapa.
- **Referência.** Uma plataforma de aplicativos mostra o texto das alterações. Uma plataforma de agentes mostra o código por deploy.
- **Princípios.** E1, E4, E7 (Alterações e Versões mostram o histórico por dois ângulos).

#### TA9. Sobre (`$projectId_.about.tsx`)

- **Para que serve.** Dizer o que é o Projeto e, para quem pode, apagá-lo. A6 em parte, E4.
- **Conteúdo obrigatório.** "Criado em"; "Endereço do app" (`hub/projects/project.tsx`); "Apagar Projeto" ou a frase de quem pode; abas Sobre e Versões (`about.tsx`). Falta com fonte: título com o nome do Projeto; quem criou (a API não traz, `packages/hub-api/src/projects.ts`); versão publicada e desde quando.
- **Ações.** Apagar Projeto, Dono e Administrador (`packages/hub-api/src/projects.ts`); o diálogo pede o nome digitado (`delete-project-dialog.tsx`).
- **Ação principal.** Nenhuma não destrutiva.
- **Estados.** Com dado; sem endereço (`project.tsx`); apagar sem confirmação (`delete-project-dialog.tsx`); já não existe.
- **Faixa de dados.** Nome 1 a 100; endereço `<projeto>--<empresa>.<domínio>`.
- **Hoje falta.** Aba e título "Sobre" repetidos; endereço sem link nem copiar (`project.tsx`). Apagar não se desfaz; um prazo para desfazer é escolha em aberto.
- **Referência.** Uma referência tem o painel de informação do app. Uma plataforma de agentes mostra "Recently deleted".
- **Princípios.** E3 F. E4 P. E6 P. E7 F.

#### TA10. Versões (`about?part=versions`)

- **Para que serve.** Ver as versões e escolher qual vale para quem abre o app. A6, E3, E5.
- **Conteúdo obrigatório.** Da mais nova à mais velha: "Versão N", estado em palavra (`hub/apps/versions.tsx`), dia e hora, quem enviou; o pedido aberto e a última falha.
- **Ações.** "Publicar esta", Dono e Administrador, em versão pronta não publicada, com diálogo (`publish.tsx`). "Pedir esta" para os outros (`publish.tsx`). Ler, todo membro.
- **Ação principal.** Publicar esta versão.
- **Estados.** "Nenhuma versão ainda…"; esqueleto; sem paginação (`packages/hub-api/src/apps.ts`); erro; não encontrado; enviando; falhou; versão sumida (`publish.tsx`).
- **Faixa de dados.** De 0 sem teto; cresce com o uso.
- **Hoje falta.** O que mudou em cada versão. "Voltar" não aparece; é "Publicar esta" numa versão mais velha (`versions.tsx`).
- **Referência.** Uma plataforma de agentes mostra Status, Source, Trigger e Time por deploy. Uma plataforma de aplicativos tem as mensagens de versão.
- **Princípios.** E1 P. E4 em parte. E5 P. E7 P.

#### TA11. Quem usa o app (`$projectId_.access.tsx`)

- **Para que serve.** Decidir quem usa o app e com qual papel. A6.
- **Conteúdo obrigatório.** "Quem usa o app"; por pessoa, nome, e-mail, "desde" (`hub/projects/access.tsx`) e papel (`packages/hub-api/src/app-access.ts`; `access.tsx`); convites com validade; "Dar acesso"; "Publique o app para dar acesso a alguém."; frase de quem pode.
- **Ações.** Dar acesso, mudar papel, tirar (com aviso), cancelar convite, só quem gerencia. Ler, todos.
- **Ação principal.** Dar acesso.
- **Estados.** Só membros e a frase de publicar; "Carregando quem usa o app…"; erro; recusa na linha; recusas no campo; "Salvo".
- **Faixa de dados.** Sem paginação nem busca; sem teto. Volume típico sem medida.
- **Hoje falta.** O cabeçalho das colunas só para leitor de tela (`ui/table.tsx`). A pessoa de fora não se distingue. A mesma lista também em Pessoas e convites (`docs/approvals/e18-entrar-num-app.md`).
- **Referência.** Uma referência controla o acesso por grupo; o modo público não serve, porque o Conexus não publica sites abertos. Uma plataforma de aplicativos convida usuários por formulário.
- **Princípios.** E1 em parte (sem ano). E4 P. E6 P. E7 em parte.

## 5. Defeitos que cruzam áreas

| Defeito | Onde (fichas) | Fonte |
| --- | --- | --- |
| Título da página dentro do Projeto sem o nome dele (regra do nível, mapa 5) | TD9, TD10, TG7, TG9, TG12, TG15, TA4, TA9, TA11 | `hub/projects/area.tsx`; "Integrações deste Projeto" em `hub/connectors/text.ts` |
| Coluna de conversas em lugares que não são do Início (mapa 4 a tira) | TD1, TG3, TG4, TG5, TA1 | as listas de Integrações, Automações e Projetos |
| A ação fora do papel some em vez de ficar à vista e desligada (E6); o agente já faz certo | TD1, TD5, TD9 contra TG10 | `hub/connectors/integrations.tsx`; `hub/projects/project-integrations.tsx`; contra `agents/saved-agent/write-lines.tsx` |
| Modos de salvar diferentes (botão, ao mexer, ao sair do campo sem "Salvo") | TB15, TB19, TB20, TB21, TG10, TA11 | `harness/model-accounts/model-fallback.tsx`; `harness/memory/settings.tsx`; `agents/saved-agent/config-panel.tsx`; `hub/projects/access.tsx` |
| A mesma coisa em dois lugares | TB17 e TA11 (acesso a app); TB21, TB13 e TD11 (três "Memórias") | `docs/approvals/e18-entrar-num-app.md` |
| Dado sem fonte nem hora (E1) | TD10, TG4, TG6, TB13 | `hub/apps/data-rows.tsx`; "Rodou há 3 h" sem versão em `agents/saved-agent/agent-list.tsx`; "Pronta" sem dado em `agents/assistant/automations/runs.tsx`; memória da pessoa sem fonte em `agents/assistant/profile-memory.tsx` |
| Confirmação desigual para atos parecidos (E4) | TD9; TG14 contra TG10; TB4 | Publicar sem mensagem em `agents/agent-builder/draft-panel.tsx` contra `publish.tsx`; Recusar convite sem confirmar em `hub/identity/invitation.tsx` |
| Lista sem a última execução ou atividade (E3) | TG5, TB22, TA1 | `hub/operations/clients.tsx`; `hub/projects/project-cards.tsx` |
| Erro sem ação ou genérico (web W34) | TA1, TG2 | `harness/room/chat.tsx` |
| No celular some o que a pessoa precisa | TA3, TA6, Configurações | `hub/projects/area.tsx`; `agents/app-builder/preview/preview.tsx` |
| Título automático de conversa pela data, igual em duas | TG1, TG2, TG3, TG7 | `harness/room/text.ts` |
| Estado sem palavra | TD1 | `hub/connectors/text.ts` (`NEW` não tem palavra) |
