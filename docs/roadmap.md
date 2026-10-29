# Roteiro do Conexus no repositório novo

## 1. A página do fundador

### As etapas, e o que você faz quando cada uma fecha

Aprovações e usos: [aprovações](approvals.md).

1. **Hub no ar.** Publica e volta atrás.
2. **Banco do Hub.** Restaura o banco, e o vê dormir e acordar.
3. **Entrar.** Entra e sai.
4. **Empresa e convite.** Convida alguém, que aceita e entra.
   4.1 **Convite completo.** Cria a senha no convite, cancela ou recusa um.
   4.2 **Cadastro de cliente.** Cadastra um cliente na Central, e o administrador dele entra como dono.
5. **Duas empresas.** Vê que uma não enxerga a outra, e a Central apaga uma.
6. **Tirar uma pessoa.** Desativa alguém. Outra recupera a senha.
7. **Projeto.** Cria e apaga um Projeto, com o banco da empresa.
8. **App de exemplo.** Abre um app escrito à mão.
9. **Enviar um app.** Manda uma versão nova pelo Hub, e o app grava.
   9.1 **Direto ao app.** Entra e vê o app, sem o Hub no meio; o Neon mostra o apelido.
10. **Recusar um app.** Vê o Hub recusar um app com defeito.
11. **Conta de modelo.** Liga chaves de API, assinatura Claude e Google, em filas por fornecedor.
12. **Primeira conversa.** Pergunta ao Builder, e ele responde.
    12.1 **A conversa no painel.** Conversa no painel e vê o Builder pensar.
    12.2 **A casa.** Barra lateral, Início e primeira entrada.
    12.3 **Padrões.** Escolhe com que modelo as conversas começam.
13. **O Builder escreve.** Pede um app e vê os arquivos guardados.
14. **O Builder constrói.** Pede um app, responde às perguntas, aprova o plano e vê a versão que monta.
    14.0 **Um registro da conversa.** Conversa como antes; depois de um reinício do Hub, vê o aviso direto.
    14.2 **Correção de tudo.** Vê o Builder trabalhar como na Factory, agora sobre o Mastra.
    14.1 **A Prévia.** Abre na Prévia o app que ele escreveu.
    14.3 **Arquivos e voz.** Anexa arquivos na conversa com o Builder e dita a mensagem.
    13.1 **O primeiro pedido.** Pede o primeiro app no Início e vê o Projeto criado.
    13.2 **Configurações.** Vê as páginas na largura, as contas numa página, botões menores.
15. **Mudar o app.** Muda os dados sem perder nada.
17. **Publicar.** Publica um app e o abre.
18. **Entrar num app.** Convida alguém só para um app, e tira o acesso.
19. **Conectores: o kit e a primeira ligação.** Liga o Sankhya em Integrações, na barra lateral, e testa.
    19.1 **Ligar por OAuth.** Liga o Mercado Livre e o vê pedir para conectar de novo.
20. **App com dados de um conector.** Libera uma ligação num Projeto e abre um app com os dados dela.
    20.1 **Escrever pelo app.** Responde pelo app uma pergunta do Mercado Livre.
    20.2 **App que se atualiza.** Vê o app mudar sozinho com um aviso do fornecedor.
    20.3 **Jet.** Liga a Jet, feita com o kit.
    20.4 **Notificações.** Vê um convite chegar como evento na lista de notificações.
21. **Outras contas.** Liga a da OpenAI, se os termos confirmarem.
    21.1 **Ver o que acontece.** Vê a Atividade da empresa e o painel.
16. **Atualizar sem cortar.** Conversa enquanto o Conexus é atualizado.
22. **Ensaio geral.** Restaura tudo junto, pelo procedimento.
23. **Primeira empresa.** Uma empresa de verdade usa um app.
24. **Agentes com conectores.** Um agente usa as ligações e pede "Aprovar?" antes de escrever (resposta B, 2026-10-18).

### O que você fornece, e quando

| Etapa | O que | Gasto que uma página dá |
| --- | --- | --- |
| 1 | A conta Cloudflare com o domínio do Hub. O servidor de São Paulo | Servidor: não lido |
| 2 | A organização do Neon, no plano grátis | US$ 0 |
| 4 | O remetente dos convites, com o DNS | Workers Paid: US$ 5 por mês |
| 7 | Neon das empresas | US$ 0 |
| 8 | O domínio dos apps | Workers for Platforms: US$ 25 por mês |
| 9, 11 | Token dos apps. Cópia das chaves | Nenhum |
| 11, 21 | As assinaturas de modelo | Nenhum |
| 13 | Uma chave do E2B (a da conta grátis). Um bucket privado no R2 | E2B pago: US$ 150 por mês, se o uso pedir |
| 19 | Usuário só de leitura no Sankhya de uma empresa | Nenhum |
| 19.1 | O seu app de desenvolvedor do Mercado Livre | Não lido |
| 20.3 | O ambiente de teste da Jet, por você ou um cliente (em aberto) | Não lido |
| 22 | Um lugar de cópia fora do Neon | Não lido |
| 23 | O Neon no plano Launch. O aviso do que sai do Brasil, com uma linha: o ditado no Chrome passa pelo Google | Cerca de US$ 19,35 por mês por banco sempre acordado |

### O que fica fora do lançamento

Login social. Arquivos enviados por pessoas para dentro de um app ou da máquina (na conversa com o Builder eles entram, na 14.3). Medição de uso, segundo idioma. Domínio de empresa.

### As suas respostas de 2026-10-13

1. **Código antigo só entra com os consertos médios e grandes feitos.** "2. A": "ele não manter decisões antigas só porque elas já foram
   feitas." Vive na regra do estudo, no `conexus-study`.
2. **A 16 vai para depois da 21.1, antes da 22, com o número que tem.** Em 2026-10-22: "Cara, então vamos mudar esse roadmap aí, velho. Porque essa 16 pra mim não faz sentido entrar agora ... Deixarei ela mais pro final mesmo." e, à posição antes da 22, "Sim". Nenhuma etapa depende dela; os consertos de execução da auditoria e os testes 9 e 10 vão com ela.
3. **Arquivos e voz entram como a 14.3, depois da 14.1.** "A1 sim B1 okay ... C sim", "B1 por agora".
4. **O Início que você planeja vem depois da Prévia e da 14.3.** A ordem é 14.1, 14.3, 13.1: "Concordo documente tudo isso para ser registrado".
5. **O roadmap perde o detalhe das etapas fechadas.** Em 2026-10-29: "Roadmap pode ir removendo o que foi de etapas passadas se tiver detalhes ou algo assim, se não vamos ter que aumentar ele para não perder informação". A linha de uma etapa fechada sai da tabela; o que ficou é nas [aprovações](approvals.md). O teto de 1.600 palavras não sobe.

## 2. As etapas

| Etapa | O que precisa antes | Decisão sua nela | Conhecimento trazido |
| --- | --- | --- | --- |
| 15 Mudar o app | A 14.1 | Nenhuma | Migrações atômicas de app. O lote |
| 18 Entrar num app | A 17 | Onde a checagem de sessão vive, pelo teste | Ficha de sessões e passagem. LT1 a LT4 e LT9 |
| 19 Conectores | A 11 | Nenhuma | Os estudos de conectores (fundador, 2026-10-28: "H okay"). O kit `packages/connectors`. Sankhya: operações prontas para o comum (pedidos, produtos, parceiros, impostos), lidas na API pelo Context7 e no site oficial, e a porta de leitura do DbExplorer para cada empresa. Integrações na barra da empresa |
| 19.1 Ligar por OAuth | A 19 | Nenhuma | A trava de renovação entre cópias do Hub |
| 20 App com dados | A 18 e a 19.1 | Nenhuma | A barra do Projeto nasce com Integrações. O caderno da ligação. Banco livre durante a chamada |
| 20.1 Escrever pelo app | A 20 | Nenhuma | Leitura, escrita, destrutiva. Escrita nova pede nova liberação |
| 20.2 App que se atualiza | A 20 | Nenhuma | Avisos do fornecedor (S48) |
| 20.3 Jet | A 20 | Quem pede o ambiente de teste | Fornecedor com documentação fina |
| 20.4 Notificações | A 20 | Nenhuma | O estudo do portal de eventos. Fundador, 2026-10-29: "podemos ir depois da 20 as notificações" |
| 21 Outras contas | A 12 | Nenhuma | A leitura dos termos da OpenAI |
| 21.1 Ver o que acontece | A 20 | Grafana no Brasil, provado | Um só caminho OTel (0052) |
| 16 Atualizar sem cortar | A 14 | Nenhuma | Consertos de execução da auditoria. Testes 9 e 10 |
| 22 Ensaio geral | A 21.1 | O lugar da cópia fora do Neon | Ensaios das etapas 2, 7, 9, 12 e 13. Teste de carga |
| 23 Primeira empresa | A 22 | Os riscos aceitos. O plano pago | A seção 11 da arquitetura |
| 24 Agentes com conectores | A 23 | Nenhuma | Aprovação por classe. Code Mode só em leituras, se medido |
