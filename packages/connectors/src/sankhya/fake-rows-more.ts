export const VENDEDORES = [
  {
    codigoVendedor: 7,
    nome: 'Vendedor Sete',
    ativo: true,
    tipo: 1,
    email: 'sete@example.test',
    codigoEmpresa: 1,
    codigoGerente: 8,
    nomeGerente: 'Vendedor Oito',
    comissaoVenda: 2.5,
    comissaoGerencia: 1,
  },
  {
    codigoVendedor: 8,
    nome: 'Vendedor Oito',
    ativo: true,
    tipo: 2,
    email: 'oito@example.test',
    codigoEmpresa: 1,
    comissaoVenda: 3,
    comissaoGerencia: 0,
  },
]

export const NATUREZAS = [
  {
    codigoNatureza: 30100,
    nome: 'Receita com vendas',
    analitica: true,
    grau: 3,
    ativo: true,
    codigoCentroResultado: 202,
    codigoNaturezaPai: 30000,
    tipoNatureza: 1,
  },
  {
    codigoNatureza: 40100,
    nome: 'Compra de mercadoria',
    analitica: true,
    grau: 3,
    ativo: true,
    tipoNatureza: 2,
  },
]

export const CENTROS = [
  {
    codigoCentroResultado: 202,
    nome: 'Comercial',
    analitico: true,
    grau: 2,
    ativo: true,
    codigoCentroResultadoPai: 200,
  },
  { codigoCentroResultado: 203, nome: 'Logística', analitico: true, grau: 2, ativo: true },
]

export const GRUPOS = [
  { codigoGrupoProduto: 1, nome: 'Grupo Um', grau: 1, analitico: true, ativo: true },
  {
    codigoGrupoProduto: 2,
    nome: 'Grupo Dois',
    codigoGrupoProdutoPai: 1,
    grau: 2,
    analitico: true,
    ativo: true,
  },
]

export const NOTAS = [
  {
    codigoEmpresa: 1,
    nomeEmpresa: 'Empresa Alfa',
    cliente: {
      tipo: 'PJ',
      cnpjCpf: '00000000000100',
      nome: 'Cliente Um',
      razao: 'Cliente Um Ltda',
    },
    confirmada: true,
    pendente: false,
    dataNegociacao: '2026-10-01',
    numeroNota: 7001,
    codigoNota: 201,
    serieNota: '1',
    codigoTipoOperacao: 1100,
    nomeTipoOperacao: 'Venda',
    codigoVendedor: 7,
    nomeVendedor: 'Vendedor Sete',
    valorNota: 150.5,
    chaveNFe: '00000000000000000000000000000000000000000001',
    statusNFe: '1',
    itens: [
      {
        sequencia: 1,
        codigoProduto: 11,
        descricaoProduto: 'Produto Onze',
        quantidade: 2,
        unidade: 'UN',
        valorUnitario: 50,
        valorTotal: 100,
        cfop: '5102',
        impostos: [{ tipo: 'icms', cst: '00', aliquota: 18, valorBase: 100, valorImposto: 18 }],
      },
    ],
    financeiros: [
      { sequencia: 1, tipoPagamento: 1, dataVencimento: '2026-11-01', valorParcela: 150.5 },
    ],
  },
  {
    codigoEmpresa: 1,
    nomeEmpresa: 'Empresa Alfa',
    cliente: { tipo: 'PF', cnpjCpf: '00000000001', nome: 'Cliente Dois' },
    confirmada: true,
    pendente: false,
    dataNegociacao: '2026-10-02',
    numeroNota: 7002,
    codigoNota: 202,
    serieNota: '1',
    codigoTipoOperacao: 1100,
    nomeTipoOperacao: 'Venda',
    valorNota: 30,
    statusNFe: '1',
  },
]

export const FINANCEIROS = [
  {
    codigoFinanceiro: 301,
    origemFinanceiro: 'E',
    codigoEmpresa: 1,
    nomeEmpresa: 'Empresa Alfa',
    codigoParceiro: 1,
    nomeParceiro: 'Cliente Um',
    codigoNatureza: 30100,
    nomeNatureza: 'Receita com vendas',
    numeroNota: 7001,
    dataNegociacao: '01/10/2026',
    dataVencimento: '01/11/2026',
    numeroParcela: 1,
    valorParcela: 150.5,
  },
  {
    codigoFinanceiro: 302,
    origemFinanceiro: 'E',
    codigoEmpresa: 1,
    nomeEmpresa: 'Empresa Alfa',
    codigoParceiro: 2,
    nomeParceiro: 'Cliente Dois',
    codigoNatureza: 30100,
    nomeNatureza: 'Receita com vendas',
    numeroNota: 7002,
    dataNegociacao: '02/10/2026',
    dataVencimento: '02/11/2026',
    dataBaixa: '03/11/2026',
    numeroParcela: 1,
    valorParcela: 30,
    valorBaixa: 30,
  },
]

export const PRECOS = [
  { codigoProduto: 11, codigoTabela: 1, codigoLocalEstoque: 0, unidade: 'UN', valor: 50 },
  { codigoProduto: 11, codigoTabela: 2, codigoLocalEstoque: 0, unidade: 'UN', valor: 45 },
  { codigoProduto: 12, codigoTabela: 1, codigoLocalEstoque: 0, unidade: 'UN', valor: 50.5 },
]
