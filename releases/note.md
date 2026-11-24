# v0.24.118

Esta versão publica três coisas que entraram no `main` em 23/11: a primeira parte do Lago 2, a
correção da tela da conversa e as correções do servidor.

**Dados.** O Conexus deixa de criar cópia pelo jeito antigo, e o Builder não propõe mais cópia. As
cópias antigas da empresa foram apagadas. Os Projetos que liam vendas e os pedidos do Mercado Livre
ficam só com as leituras ao vivo até o lago trazer as cópias de volta, nas próximas partes do Lago 2.

**A conversa.** A tela não para mais de receber a resposta sem avisar quando a reconexão é recusada.
Ao reler a conversa no meio de um turno, o texto de um passo não aparece mais repetido.

**O servidor.**
- A máquina do Assistente não vem mais vazia quando a lista do provedor falha.
- Uma conta que bate no teto de uso fica fora até o fim do teto, não só por 15 minutos.
- O modelo lê no máximo 40.000 caracteres de uma recusa de fornecedor.
- Falhas que sumiam passam a aparecer no registro.

Segue o `G0b`: sai o que ainda lê as cópias antigas.
