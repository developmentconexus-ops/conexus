# v0.24.122

Esta versão publica o que entrou no `main` em 24/11 depois da v0.24.121: o Caderno de uma ligação
passa a só gravar com o sim de uma pessoa, e a conferência do Builder espera a tela terminar de
carregar antes de olhar o app.

**O Caderno pede o sim.** Quando o Assistente ou o Builder quer guardar uma anotação no Caderno de uma
ligação, a conversa mostra o cartão "Gravar no Caderno?" com o conceito, o mapeamento e a consulta, e
nada é provado nem gravado antes da resposta.

- Com o sim, a anotação é provada e gravada, e a página da ligação mostra "Aprovada por" e o nome de
  quem aprovou. As anotações de antes mostram "Gravada sem aprovação".
- Com o não, nada é gravado e a conversa segue.
- Só quem gerencia as ligações pode aprovar. Para quem não gerencia, o cartão mostra "Peça a quem
  gerencia a ligação." e não tem botões. Um membro de um Projeto sem esse direito deixa de gravar no
  Caderno pelo Builder.
- Se a ligação saiu, ou se a anotação foi recusada, o cartão diz isso em vez de gravar.

**Builder.** Ao conferir o app no fim do turno, o Builder agora espera a tela sair do carregando antes
de capturá-la. Antes, um app que montava devagar podia ser fotografado ainda no esqueleto, e um erro
que chegava depois não entrava no relatório. Uma tela que nunca sai do carregando não reprova a
conferência: a captura sai como está, dentro do mesmo limite de tempo de antes. No meio do turno, a
linha da conferência que não pôde rodar passa a dizer "Não consegui conferir o app agora. Isso não diz
nada sobre o app.", em vez de dizer que o código ficou guardado sem conferência, o que só vale no fim
do turno.

Segue a etapa O conector no padrão novo.
