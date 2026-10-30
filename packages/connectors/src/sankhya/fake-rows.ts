// Invented values only (S40), in the shapes the real gateway sent (measured 2026-10-30): the keys
// and the types as they came, a number as text where it came as text.

export const CLIENTES = [1, 2].map((codigo) => ({
  codigoCliente: String(codigo),
  tipo: codigo === 1 ? 'J' : 'F',
  cnpjCpf: codigo === 1 ? '00000000000100' : '00000000001',
  nome: `Cliente ${codigo}`,
  razao: `Cliente ${codigo} Ltda`,
  email: `cliente${codigo}@example.test`,
  endereco: {
    logradouro: 'Rua Inventada',
    numero: '10',
    cidade: {
      nome: `Cidade ${codigo}`,
      codigoIbge: '0000000',
      uf: 'SP',
      camposNaoMapeados: {},
      camposAdicionais: {},
    },
  },
  camposAdicionais: { AD_CAMPO_INVENTADO: 'a' },
}))

// One salesperson sends `tipo` as text where the others send a number, as the real list did.
export const VENDEDORES = [
  { codigoVendedor: 7, nome: 'Vendedor Sete', ativo: true, tipo: 1, codigoEmpresa: 1 },
  { codigoVendedor: 8, nome: 'Vendedor Oito', ativo: true, tipo: 'G', codigoEmpresa: 1 },
]

export const TIPOS_OPERACAO = [
  { codigoTipoOperacao: 1100, nome: 'Venda', tipoMovimento: 'V', ativo: true },
  { codigoTipoOperacao: 1200, nome: 'Devolução', tipoMovimento: 'D', ativo: true },
]

export const NATUREZAS = [
  { codigoNatureza: 30100, nome: 'Receita com vendas', codigoNaturezaPai: 30000, ativo: true },
]

export const CENTROS = [
  { codigoCentroResultado: 202, nome: 'Comercial', codigoCentroResultadoPai: 200, ativo: true },
  { codigoCentroResultado: 203, nome: 'Logística', ativo: true },
]

// The real field is spelled with a colon, as the API sends it.
export const PRODUTOS = [11, 12, 13].map((codigo) => ({
  codigoProduto: codigo,
  nome: `Produto ${codigo}`,
  codigoGrupoProduto: codigo === 13 ? 2 : 1,
  marca: 'Marca A',
  ativo: 'S',
  ncm: '00000000',
  'dataAlteracao:': '01/10/2026',
}))

export const GRUPOS = [
  { codigoGrupoProduto: 1, nome: 'Grupo Um', grau: 1, ativo: true },
  { codigoGrupoProduto: 2, nome: 'Grupo Dois', codigoGrupoProdutoPai: 1, grau: 2, ativo: true },
]

export const PEDIDOS = [101, 102].map((codigo) => ({
  codigoNota: codigo,
  codigoEmpresa: 1,
  cliente: { nome: `Cliente ${codigo - 100}`, cnpjCpf: '00000000000' },
  dataNegociacao: '01/10/2026',
  confirmada: codigo === 101,
  valorNota: 150.5,
  itens: [{ sequencia: 1, codigoProduto: 11, quantidade: 2, valorUnitario: 50, valorTotal: 100 }],
}))

// The invoices send their numbers as text.
export const NOTAS = [201, 202].map((codigo) => ({
  codigoNota: String(codigo),
  numeroNota: String(codigo + 6800),
  codigoEmpresa: '1',
  codigoTipoOperacao: '1100',
  valorNota: '150.50',
  statusNFe: 'A',
}))

export const NOTA_COMPLETA = {
  ...NOTAS[0],
  xmlNFe: '<nfeProc>inventado</nfeProc>',
  itens: [{ sequencia: '1', codProduto: '11', quantidade: '2', valorTotal: '100.00' }],
}

export const ESTOQUE = [
  { codigoProduto: 11, codigoEmpresa: 1, codigoLocal: 1, estoque: 40 },
  { codigoProduto: 12, codigoEmpresa: 1, codigoLocal: 1, controle: 'L1', estoque: 12.5 },
]

export const LOCAIS = [{ codigoLocal: 1, descricaoLocal: 'Depósito', grau: 1, ativo: true }]

export const FINANCEIROS = [301, 302].map((codigo) => ({
  codigoFinanceiro: codigo,
  codigoEmpresa: 1,
  codigoParceiro: 1,
  dataVencimento: '01/11/2026',
  valorParcela: 150.5,
}))

export const TIPOS_PAGAMENTO = [{ codigoTipoPagamento: 1, nome: 'Boleto', ativo: true }]

export const PRECOS = [
  { codigoProduto: 11, codigoTabela: 1, unidade: 'UN', valor: 50 },
  { codigoProduto: 11, codigoTabela: 2, unidade: 'UN', valor: 45 },
  { codigoProduto: 12, codigoTabela: 1, unidade: 'UN', valor: 50.5 },
]

export const TRANSPORTADORAS = [
  { codigoTransportadora: 5, nome: 'Transportadora Cinco', cnpj: '00000000000500', ativo: true },
]

export const ORDENS_CARGA = [
  { codigoOrdemCarga: 55, codigoEmpresa: 1, codigoVeiculo: 3, situacao: 'A' },
]
