-- Custom SQL: reference data (data D5). Step Papéis da empresa, U1, decision B1: the developer and
-- the member start reading every connector, as they do today; the fixed role holds the rest, and
-- the row holds the connectors. Once per company: a second run changes nothing.
INSERT INTO auth.organization_role (id, company_id, role, permission, label, created_at)
SELECT gen_random_uuid()::text, company.id, fixed.role, '{"connector_sankhya":["consultar","carregar","empresas","clientes","vendedores","tiposOperacao","naturezas","centrosResultado","produtos","gruposProduto","pedidos","notasFiscais","notaFiscal","devolucoes","notasCanceladas","estoque","locaisEstoque","contasAReceber","contasAPagar","tiposPagamento","precosDoProduto","precosDaTabela","transportadoras","ordensCarga"],"connector_mercado-livre":["conta","anuncios","anunciosDetalhe","descricao","estoque","qualidade","pedidos","pedido","pacote","envio","prazoDoEnvio","estoqueFull","perguntas","tempoDeResposta","mensagensNaoLidas","mensagensDoPacote","reclamacoes","reclamacao","devolucao","promocoes","visitas","periodosDeFaturamento","cobrancasDoPeriodo","notaFiscalDoPedido","tendencias","maisVendidos","tarifaDeVenda"]}', fixed.label, now()
FROM auth.company
CROSS JOIN (VALUES ('developer', 'Desenvolvedor'), ('member', 'Membro')) AS fixed (role, label)
ON CONFLICT (company_id, role) DO NOTHING;
