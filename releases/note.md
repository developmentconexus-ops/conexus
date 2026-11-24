# v0.24.121

Esta versão publica o que entrou no `main` em 24/11: o Sankhya e o Mercado Livre refeitos no padrão
novo dos conectores, e o Builder conferindo o app no navegador antes de dizer que ficou pronto.

**Sankhya e Mercado Livre.** As duas ligações funcionam como antes e respondem as mesmas perguntas,
com as mesmas leituras. O Sankhya segue lendo e escrevendo, e cada escrita continua pedindo a
aprovação de uma pessoa. O Mercado Livre segue só lendo. Mudam dois pontos:

- Os valores com fração passam a chegar como texto, por exemplo `"12.5"` no Sankhya e `"32.05"` no
  Mercado Livre, para não perder casas decimais. O Assistente, as ferramentas salvas e os apps
  recebem o texto e convertem o que usam. Um app que soma dois desses valores precisa convertê-los
  antes de somar, senão junta os textos em vez de somar os números.
- No Sankhya, a busca por um nome com colchetes, como `EMPORIO [CENTRO]`, acha o texto que a pessoa
  escreveu.

**Builder.** Ao fim de cada turno, o Builder abre o app que construiu num navegador, na máquina dele,
e confere a tela de entrada antes de dizer que a versão ficou pronta. Uma tela que dá erro, ou que
quebra ao abrir, devolve o turno ao Builder para ele corrigir. Uma versão que não inicia é recusada
no fim do turno, em vez de aparecer em Versões como "Falhou: O app não inicia.". Nesse caso a conversa
termina dizendo que a versão foi guardada e não montou, e a versão seguinte aparece em Versões já
como a que está na Prévia. Se a conferência não puder rodar, o Builder avisa que não conseguiu
conferir o app.

Segue a etapa O conector no padrão novo.
